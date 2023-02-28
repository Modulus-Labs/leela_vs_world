import { motion, Variants } from "framer-motion";
import { FC, ReactNode } from "react";

const PageVariants: Variants = {
  hidden: {
    filter: "brightness(0)",
  },
  visible: {
    filter: "brightness(1)",
    transition: {
      duration: 1,
    },
  },
};

type FadingPageWrapperProps = {
  children: ReactNode;
};

export const FadingPageWrapper: FC<FadingPageWrapperProps> = ({ children }) => {
  return (
    <motion.div
      variants={PageVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="h-full bg-off-black"
    >
      {children}
    </motion.div>
  );
};
