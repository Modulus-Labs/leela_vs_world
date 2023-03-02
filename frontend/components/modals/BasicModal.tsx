import { FC, ReactNode } from "react";
import { Variants, motion } from "framer-motion";

const BackgroundVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const ContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3,
    },
  },
};

type BasicModalProps = {
  children: ReactNode;
};

export const BasicModal: FC<BasicModalProps> = ({ children }) => {
  return (
    <motion.div
      variants={BackgroundVariants}
      initial="hidden"
      animate="visible"
      className="fixed left-0 right-0 bottom-0 top-0 z-30 flex items-center bg-black/30 backdrop-blur"
    >
      <motion.div
        variants={ContentVariants}
        className="mx-auto w-width-clamp rounded-lg bg-off-white px-7 py-5"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
