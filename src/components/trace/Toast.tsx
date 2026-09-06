import React, { useEffect, useState } from 'react';

interface Props {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 3000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>;
}
