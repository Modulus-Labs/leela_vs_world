import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC, MouseEventHandler, useCallback, useState } from 'react';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';
import { useBettingContext } from '../../contexts/BettingContext';
import { useContractInteractionContext } from '../../contexts/ContractInteractionContext';
import { addStake, voteWorldMove } from '../../utils/interact';
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

type LeelaWorldButtonProps = {
  buttonImageUrl: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const LeelaWorldButton: FC<LeelaWorldButtonProps> = ({
  buttonImageUrl,
  onClick,
}) => {
  return (
    <motion.button
      variants={ButtonVariants}
      initial="initial"
      whileTap="tap"
      onClick={onClick}
      className="h-[50px] w-[175px]"
    >
      <Image fill src={buttonImageUrl} alt="" />
    </motion.button>
  );
};

export const GameDetails: FC = () => {
  const {
    setShowGameDetails,
    setShowGameInstructions,
    setInfoModalText,
    setInfoModalDismissVisible,
    setShowInfoModal
  } = useArcadeMachineContext();
  const { leelaPrizePoolAmount, worldPrizePoolAmount } = useBettingContext();
  const { walletAddr } = useContractInteractionContext();
  const [powerAmount, setPowerAmount] = useState<string>("0.001");

  // --- To display error message to user ---
  const openModalWithOptions = (text: string, canDismiss: boolean) => {
    setInfoModalText(text);
    setInfoModalDismissVisible(canDismiss);
    setShowInfoModal(true);
  }

  // --- For displaying distribution amounts ---
  const getDistDisplay = useCallback((): string => {
    if (leelaPrizePoolAmount + worldPrizePoolAmount === 0) {
      return "N/A";
    }
    const leelaRatio = (100 * leelaPrizePoolAmount / (leelaPrizePoolAmount + worldPrizePoolAmount)).toFixed(2);
    const worldRatio = (100 * worldPrizePoolAmount / (leelaPrizePoolAmount + worldPrizePoolAmount)).toFixed(2);
    return `${leelaRatio}% Leela | ${worldRatio}% world`;
  }, [leelaPrizePoolAmount, worldPrizePoolAmount]);

  const buyPower = (betOnLeela: boolean) => {
    try {
      const numberPowerAmount = Number(powerAmount);
      console.log(`Buying ${numberPowerAmount} power, betting on Leela`);
      if (numberPowerAmount < 0.001) {
        openModalWithOptions(`Error: cannot buy less than 0.001 ETH worth of power!`, false);
        return;
      }
      addStake(walletAddr, numberPowerAmount, betOnLeela).then((result) => {
        openModalWithOptions(`Successfully bought ${numberPowerAmount} power, betting on Leela!`, true);
        setShowGameDetails(false);
      }).catch((error) => {
        openModalWithOptions(`Error in buying power: ${error.message}`, true);
        console.error(`Oof: ${error.message}`);
      });
    } catch (error: any) {
      openModalWithOptions(`Error in buying power: ${error}`, true);
    }
  }

  return (
    <GamePopup onClick={() => setShowGameDetails(false)}>
      <div className="mx-[107.5px]">
        <div className="relative mx-auto flex h-[230px] w-full flex-col bg-[url(/CurrentPrizePoolDisplay.svg)] bg-contain bg-no-repeat">
          <div className="ml-[350px] mt-[80px] mr-[30px] flex flex-col text-4xl">
            <div className="flex h-[50px] flex-row items-center border-2 border-off-white px-[15px] text-off-white">
              {`${(leelaPrizePoolAmount + worldPrizePoolAmount).toFixed(3)} ETH`}
            </div>
            <div className="mt-[10px] flex h-[50px] flex-row items-center border-2 border-off-white px-[15px] text-off-white">
              {getDistDisplay()}
            </div>
          </div>
        </div>
        <div className="relative mx-auto mt-[5px] h-[230px] w-full bg-[url(/BuyPowerDisplay.svg)] bg-contain bg-no-repeat">
          <div>
            <input
              value={powerAmount}
              type={"number"}
              step={0.001}
              onChange={(e) => setPowerAmount(e.target.value)}
              className="absolute top-[82.5px] left-[360px] w-[190px] border-2 border-off-white bg-transparent px-2 text-4xl text-off-white outline-none"
            />
            <div className="absolute left-[350px] top-[142.5px]">
              <LeelaWorldButton
                buttonImageUrl="/LeelaButton.svg"
                onClick={() => {
                  buyPower(true);
                }}
              />
            </div>
            <div className="absolute left-[610px] top-[142.5px]">
              <LeelaWorldButton
                buttonImageUrl="/WorldButton.svg"
                onClick={() => {
                  buyPower(false);
                }}
              />
            </div>
          </div>
        </div>
        <motion.button
          variants={ButtonVariants}
          initial="initial"
          whileTap="tap"
          onClick={() => {
            setShowGameDetails(false);
            setShowGameInstructions(true);
          }}
          className="relative mx-auto mt-2 block h-[95px] w-[500px]"
        >
          <Image fill src="/HowDoesThisWorkButton.svg" alt="" />
        </motion.button>
      </div>
    </GamePopup>
  );
};
