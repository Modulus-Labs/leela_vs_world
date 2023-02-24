import clsx from 'clsx';
import { motion, Variants } from 'framer-motion';
import { MouseEventHandler, FC, useState, useEffect, useRef, useCallback } from 'react';

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
  animating: boolean;
};

export const RetroButton: FC<RetroButtonProps> = ({
  buttonImageUrl,
  onClick,
  animating,
}) => {

  const [currentScale, setCurrentScale] = useState<number>(1);
  const growingRef = useRef<boolean>(true);
  useEffect(useCallback(() => {
    if (animating) {
      const scaleInterval = setInterval(() => {
        setCurrentScale((scale) => {
          if (scale > 1.05) {
            growingRef.current = false;
          }
          if (scale < 0.95) {
            growingRef.current = true;
          }
          return growingRef.current ? scale + 0.01 : scale - 0.01;
        });
      }, 100);
      return () => clearInterval(scaleInterval);
    }
  }, [animating]), [animating]);

  return (
    <motion.button
      animate={{
        scale: currentScale,
        transition: {
          type: 'tween',
          duration: 0.1,
        },
      }}
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className={clsx(`h-full w-full bg-contain bg-no-repeat`, buttonImageUrl)}
    />
  );
};
