import React, { useState } from 'react';
import { AppModal } from '@/components/ErrorBoundary';
import { authenticatedPost } from '@/utils/api';
import { blockErrorMessage } from '@/utils/blocking';

interface BlockMemberModalProps {
  visible: boolean;
  /** Post whose author is being blocked (the app never sees author ids). */
  postId: string | null;
  onClose: () => void;
  /** Called after the server confirmed the block, so the caller can hide the content. */
  onBlocked: (postId: string) => void;
}

/**
 * Confirm dialog for "Block member" on community content.
 * Blocking hides the member's posts from you (and yours from them) and can be undone
 * from Profile → Blocked Users.
 */
export default function BlockMemberModal({ visible, postId, onClose, onBlocked }: BlockMemberModalProps) {
  const [blocking, setBlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const close = () => {
    if (blocking) return;
    setErrorMessage('');
    onClose();
  };

  const confirmBlock = async () => {
    if (!postId || blocking) return;
    setBlocking(true);
    setErrorMessage('');
    try {
      await authenticatedPost('/api/blocks', { postId });
      onBlocked(postId);
      onClose();
    } catch (error: any) {
      console.warn('[BlockMember] Block failed:', error?.message || error);
      setErrorMessage(blockErrorMessage(error));
    } finally {
      setBlocking(false);
    }
  };

  if (errorMessage) {
    return (
      <AppModal
        visible={visible}
        title="Couldn't block"
        message={errorMessage}
        actions={[{ label: 'OK', onPress: close, style: 'default' }]}
        onDismiss={close}
      />
    );
  }

  return (
    <AppModal
      visible={visible}
      title="Block this member?"
      message="You won't see their posts in the community, and they won't see yours. They won't be notified. You can unblock them anytime in Profile → Blocked Users."
      actions={[
        { label: blocking ? 'Blocking...' : 'Block', onPress: confirmBlock, style: 'destructive', loading: blocking },
        { label: 'Cancel', onPress: close, style: 'cancel' },
      ]}
      onDismiss={close}
    />
  );
}
