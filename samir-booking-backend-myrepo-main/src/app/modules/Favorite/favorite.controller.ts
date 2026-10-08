import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FavoriteService } from "./favorite.service";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { savedUserId } = req.body;

  const result = await FavoriteService.toggleFavorite(userId, savedUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isSaved
      ? "User saved successfully"
      : "User unsaved successfully",
    data: result,
  });
});

const getMySavedUsers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const options = pick(req.query, paginationFields);

  const result = await FavoriteService.getMySavedUsers(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Saved users retrieved successfully",
    data: result,
  });
});

const getMyClients = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const options = pick(req.query, paginationFields);

  const result = await FavoriteService.getMyClients(providerId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Clients retrieved successfully",
    data: result,
  });
});

export const FavoriteController = {
  toggleFavorite,
  getMySavedUsers,
  getMyClients,
};
