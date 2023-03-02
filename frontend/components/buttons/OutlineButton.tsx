import { FC, MouseEventHandler } from "react";
import { motion, Variants } from "framer-motion";
import clsx from "clsx";

const ButtonVariants: Variants = {
  initial: {
    filter: "brightness(100%)",
    scale: 1,
  },
  tap: {
    filter: "brightness(85%)",
    scale: 0.975,
  },
};

type OutlineButtonProps = {
  type?: "button" | "submit";
  text: string;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement> | (() => Promise<any>);
  className?: React.ComponentProps<"button">["className"];
};

export const OutlineButton: FC<OutlineButtonProps> = ({
  type = "button",
  text,
  disabled = false,
  onClick,
  className,
}) => {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      className={clsx(
        "w-fit rounded-lg border bg-off-white px-3 py-1",
        className
      )}
    >
      {text}
    </motion.button>
  );
};
