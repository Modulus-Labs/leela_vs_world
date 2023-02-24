import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';
import { GamePopup } from './GamePopup';

const ButtonVariants: Variants = {
  initial: {
    filter: 'brightness(100%)',
    scale: 1,
  },
  tap: {
    filter: 'brightness(85%)',
    scale: 0.975,
  },
};

export const GameInstructions: FC = () => {
  const { setShowGameInstructions } = useArcadeMachineContext();

  return (
    <GamePopup onClick={() => setShowGameInstructions(false)}>
      <div className="mx-[40px]">
        <div className="relative mx-auto h-[565px] w-full bg-[url(/HowDoesLeelaVsWorldWorkDisplay.svg)] bg-contain bg-no-repeat px-[50px] pt-[130px]">
          <p className="text-3xl text-off-white">
            {"\"Leela vs the World\" is a game of chess (medium link) — a simple global board where an experiment unlike any before is playing out right before our eyes."}
            <br />
            {"On one side: \"Leela\""}
            <br />
            {"She's a highly skilled reinforcement learning chess engine based on the popular Lc0 (link). Her moves are also verified at each step using zero-knowledge proofs, so you know it's always her (link)."}
            <br />
            {"On the other side: \"The World\""}
            <br />
            {"That's us. Each turn, we have 1 hour to stake money behind possible moves. At the end of the timer, one will be chosen randomly weighted by the amount of $ behind the nominated moves."}
            <br />
            {"Here's the twist: to submit your vote, you must bet that either \"Leela\" or \"The World\" wins the game"}
            <br />
            {"If you're correct, you'll get your initial stake back, along with a proportional cut of the other side's staked pool."}
            <br />
            {"In other words:"}
            {"- If you bet on \"The World:\" you'd vote each round for the strongest possible move for the human team, and"}
            {"- If you bet on \"Leela:\" you'd vote for bad moves that jeopardize our chance at victory"}
            {"That's right, it's the age old question of whether collective wisdom or self-interested infighting wins the day... shall we find out?"}
          </p>
        </div>
      </div>
    </GamePopup>
  );
};
