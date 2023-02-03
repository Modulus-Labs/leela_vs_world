import clsx from 'clsx';
import { FC, MouseEventHandler } from 'react';

type BasicButtonProps = {
  type?: 'button' | 'submit';
  text: string;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement> | (() => Promise<any>);
  className?: React.ComponentProps<'button'>['className'];
};

export const BasicButton: FC<BasicButtonProps> = ({
  type = 'button',
  text,
  disabled,
  onClick,
  className,
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx('border-2 border-r-2 border-off-white', className)}
    >
      {text}
    </button>
  );
};
