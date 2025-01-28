import React from 'react';
import styled from 'styled-components';

const MessageInputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-top: 1px solid #ddd;
`;

const MessageInput = () => {
  return (
    <MessageInputContainer>
      {/* Input field and send button will go here */}
    </MessageInputContainer>
  );
};

export default MessageInput;
