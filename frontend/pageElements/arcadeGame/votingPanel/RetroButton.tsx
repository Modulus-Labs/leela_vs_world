import clsx from 'clsx';
import { motion, Variants } from 'framer-motion';
import { MouseEventHandler, FC } from 'react';

const ButtonVariants: Variants = {
  initial: {
    filter: 'brightness(100%)',
    scale: 1,
  },
  tap: {
    filter: 'brightness(85%)',
    scale: 0.99,
  },
};

type RetroButtonProps = {
  buttonImageUrl: React.ComponentProps<'button'>['className'];
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export const RetroButton: FC<RetroButtonProps> = ({
  buttonImageUrl,
  onClick,
}) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className={clsx(`h-7 w-full bg-contain bg-no-repeat`, buttonImageUrl)}
    />
  );
};
