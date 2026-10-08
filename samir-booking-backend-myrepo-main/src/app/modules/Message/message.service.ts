import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ChannelType, Prisma, UserRole, UserStatus } from "@prisma/client";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { broadcastToChannel } from '../../../server';
import { IMessageFilterRequest } from "./message.interface";
import { searchableFields } from "./message.constant";

// send message
const sendMessage = async (
  senderId: string,
  receiverId: string,
  message: string,
  imageUrls: string[],
) => {
  const [person1, person2] = [senderId, receiverId].sort();
  const channelName = person1 + person2;

  if (!senderId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "UNAUTHORIZED");
  }

  // use transaction
  const [channel, newMessage] = await prisma.$transaction(
    async (prismaTransaction) => {
      let channel = await prismaTransaction.channel.findFirst({
        where: {
          channelName: channelName,
        },
      });

      if (!channel) {
        channel = await prismaTransaction.channel.create({
          data: {
            channelName,
            person1Id: senderId,
            person2Id: receiverId,
          },
        });
      }

      //  message created
      const newMessage = await prismaTransaction.message.create({
        data: {
          message,
          senderId,
          channelName: channelName,
          files: imageUrls,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      });

      // Update channel updatedAt timestamp
      await prismaTransaction.channel.update({
        where: { id: channel.id },
        data: { updatedAt: new Date() }
      });

      return [channel, newMessage];
    },
  );

  // Broadcast to all clients in the channel via WS
  broadcastToChannel(
    channel.channelName,
    {
      type: "message",
      channelName: channel.channelName,
      data: newMessage,
    }
  );

  return newMessage;
};

// ------------------------ reported message to admin group ------------------------

// send message to admin group for resolve reports issue
const adminSendReportMessage = async (
  senderId: string,
  reportId: string,
  message: string,
  imageUrls: string[],
) => {
  // check report exists
  const report = await prisma.support.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
  }

  // check permission
  const user = await prisma.user.findUnique({
    where: { id: senderId },
  });

  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }

  // find or create channel (channelName = reportId)
  let channel = await prisma.channel.findUnique({
    where: { channelName: reportId },
  });

  if (!channel) {
    channel = await prisma.channel.create({
      data: {
        channelName: reportId,
        type: ChannelType.GROUP,
        person1Id: senderId, // admin optional,
        person2Id: report.userId, // report owner
      },
    });
  }

  //  create message
  const newMessage = await prisma.message.create({
    data: {
      message,
      senderId,
      channelName: reportId,
      files: imageUrls,
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  // Broadcast to all clients in the channel via WS
  broadcastToChannel(
    reportId,
    {
      type: "message",
      channelName: reportId,
      data: newMessage,
    }
  );

  return newMessage;
};

// get all reported group channels for admin
const getReportedChannels = async (
  params: IMessageFilterRequest,
  options: IPaginationOptions,
) => {
  const { searchTerm } = params;
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.ChannelWhereInput[] = [];

  // type group
  filters.push({ type: ChannelType.GROUP });

  // search reported user by name, email
  if (searchTerm) {
    filters.push({
      person2: {
        OR: [
          { fullName: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    });
  }

  const where: Prisma.ChannelWhereInput = {
    AND: filters,
  };

  const channels = await prisma.channel.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      person2: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // only last message
      },
    },
  });

  // total count for pagination
  const total = await prisma.channel.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: channels,
  };
};

// ------------------------ reported message to admin group ------------------------

// get my channel by my id
const getMyChannelByMyId = async (
  userId: string,
  params: IMessageFilterRequest,
  options: IPaginationOptions
) => {
  const { searchTerm } = params;
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  // user active
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found or inactive");
  }

  const filters: Prisma.ChannelWhereInput[] = [];

  if (searchTerm) {
    filters.push({
      OR: [
        {
          person1: {
            OR: [
              { fullName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
        {
          person2: {
            OR: [
              { fullName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      ],
    });
  }

  const where: Prisma.ChannelWhereInput = {
    AND: [
      {
        OR: [{ person1Id: userId }, { person2Id: userId }],
      },
      ...filters,
    ],
  };

  // find channels where person1 or person2
  const channels = await prisma.channel.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { updatedAt: "desc" },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  // keep active
  const result = channels.map((channel) => {
    let receiverUser = null;

    if (channel.person1Id === userId) {
      receiverUser =
        channel.person2 && channel.person2.status === UserStatus.ACTIVE
          ? channel.person2
          : null;
    } else if (channel.person2Id === userId) {
      receiverUser =
        channel.person1 && channel.person1.status === UserStatus.ACTIVE
          ? channel.person1
          : null;
    }

    const lastMessage = channel.messages.length > 0 ? channel.messages[0] : null;

    let isReadByMe = true;
    let isReadByOther = true;

    if (lastMessage) {
      if (lastMessage.senderId !== userId && !(lastMessage as any).isRead) {
        // The message was sent TO me, and I haven't read it yet
        isReadByMe = false;
      }
      if (lastMessage.senderId === userId && !(lastMessage as any).isRead) {
        // The message was sent BY me, and the receiver hasn't read it yet
        isReadByOther = false;
      }
    }

    return {
      id: channel.id,
      channelName: channel.channelName,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      receiverUser,
      lastMessage,
      isReadByMe,
      isReadByOther,
    };
  });

  // only return channels receiverUser
  const filteredChannels = result.filter((ch) => ch.receiverUser !== null);

  const total = await prisma.channel.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: filteredChannels,
  };
};

// get my channel through my id and receiver id
const getMyChannel = async (userId: string, receiverId: string) => {
  // find person1 and person2
  const user1 = await prisma.user.findUnique({ where: { id: userId } });
  const user2 = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!user1 || !user2) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const [person1, person2] = [userId, receiverId].sort();
  const channelName = person1 + person2;
  const channel = await prisma.channel.findFirst({
    where: {
      channelName: channelName,
    },
  });
  return channel;
};

// get all messages
const getMessagesFromDB = async (
  channelName: string,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  // message fetch
  const messages = await prisma.message.findMany({
    where: {
      channelName,
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  // total count message based
  const total = await prisma.message.count({
    where: {
      channelName,
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: messages,
  };
};

// get user channels with search + pagination
const getUserChannels = async (
  userId: string,
  params: IMessageFilterRequest,
  options: IPaginationOptions,
) => {
  const { searchTerm } = params;
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  // make sure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const filters: Prisma.ChannelWhereInput[] = [];

  // search filter on person1 / person2
  if (searchTerm) {
    filters.push({
      OR: [
        {
          person1: {
            OR: [
              { fullName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
        {
          person2: {
            OR: [
              { fullName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      ],
    });
  }

  const where: Prisma.ChannelWhereInput = {
    AND: [
      {
        OR: [{ person1Id: userId }, { person2Id: userId }],
      },
      ...filters,
    ],
  };

  // fetch channels with pagination
  const channels = await prisma.channel.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  // total count for pagination
  const total = await prisma.channel.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: channels,
  };
};

// get all channels only user and admin
const getUserAdminChannels = async () => {
  // find all channels
  const channels = await prisma.channel.findMany({
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // filter: keep only channels where both persons are active & role in ADMIN | USER
  const result = channels.map((channel) => {
    let receiverUser = null;

    // person1 is valid receiver?
    if (
      channel.person1 &&
      channel.person1.status === UserStatus.ACTIVE &&
      (channel.person1.role === UserRole.USER ||
        channel.person1.role === UserRole.ADMIN)
    ) {
      receiverUser = channel.person1;
    }

    // person2 is valid receiver?
    if (
      channel.person2 &&
      channel.person2.status === UserStatus.ACTIVE &&
      (channel.person2.role === UserRole.USER ||
        channel.person2.role === UserRole.ADMIN)
    ) {
      // decide receiverUser based on some logic, e.g., prefer person2
      // or you can keep both in array if you want
      receiverUser = receiverUser
        ? [receiverUser, channel.person2]
        : channel.person2;
    }

    return {
      id: channel.id,
      channelName: channel.channelName,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      receiverUser,
    };
  });

  // only return channels where valid receiver exists
  return result.filter((ch) => ch.receiverUser !== null);
};

// get single channel
const getSingleChannel = async (channelId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      messages: {
        select: {
          id: true,
          senderId: true,
          message: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!channel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Channel not found");
  }

  // receiver user
  let receiverUser = null;

  if (channel.messages.length > 0) {
    const firstMessageSenderId = channel.messages[0].senderId;

    if (firstMessageSenderId === channel.person1Id) {
      receiverUser = channel.person2;
    } else if (firstMessageSenderId === channel.person2Id) {
      receiverUser = channel.person1;
    }
  } else {
    // no messages
    receiverUser = channel.person2;
  }

  return {
    id: channel.id,
    channelName: channel.channelName,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    receiverUser,
    messages: channel.messages,
  };
};

// get specific channel messages by channel id
const getChannelMessages = async (
  userId: string,
  channelId: string,
  params: IMessageFilterRequest,
  options: IPaginationOptions,
) => {
  // dynamically check if they passed auto-generated ObjectId (24 chars) or channelName (48 chars)
  const isObjectId = channelId.length === 24;

  const channel = await prisma.channel.findFirst({
    where: isObjectId ? { id: channelId } : { channelName: channelId },
    include: {
      person1: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
        },
      },
      person2: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!channel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Channel not found");
  }

  // Determine receiver user
  let receiverUser = null;
  if (channel.person1Id === userId) {
    receiverUser = channel.person2;
  } else if (channel.person2Id === userId) {
    receiverUser = channel.person1;
  } else {
    // If user is neither person1 nor person2, verify if they are an admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN)) {
      throw new ApiError(httpStatus.FORBIDDEN, "You are not a participant in this channel");
    }
  }

  const { searchTerm } = params;
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const messageWhere: Prisma.MessageWhereInput = {
    channelName: channel.channelName,
  };

  if (searchTerm) {
    messageWhere.message = {
      contains: searchTerm,
      mode: "insensitive",
    };
  }

  // Auto-mark unread messages as read if I am part of the channel
  if (channel.person1Id === userId || channel.person2Id === userId) {
    const updateData: any = { isRead: true };
    await prisma.message.updateMany({
      where: {
        channelName: channel.channelName,
        senderId: { not: userId }, // the messages sent BY the other person
        isRead: false,
      } as any, // bypass ts strictness until type rebuilds
      data: updateData,
    });
  }

  // message fetch
  const messages = await prisma.message.findMany({
    where: messageWhere,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" }, // newest first
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  const total = await prisma.message.count({
    where: messageWhere,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    channelInfo: {
      id: channel.id,
      channelName: channel.channelName,
      receiverUser,
    },
    messages: messages,
  };
};

export const MessageServices = {
  sendMessage,
  adminSendReportMessage,
  getReportedChannels,
  getMyChannel,
  getMyChannelByMyId,
  getMessagesFromDB,
  getUserChannels,
  getUserAdminChannels,
  getSingleChannel,
  getChannelMessages,
};
