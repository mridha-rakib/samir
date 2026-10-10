import React, { memo, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';



const JoditComponent = ({ content, setContent }) => {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      toolbarSticky: false,
      minHeight: 600,
    }),
    []
  );

  return (
    <div>
      <JoditEditor
        ref={editor}
        value={content || ''}
        onBlur={(newContent) => setContent(newContent)}
        config={config}
      />
    </div>
  );
};

export default memo(JoditComponent);
