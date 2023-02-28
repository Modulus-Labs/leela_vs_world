import { motion, Variants } from "framer-motion";
import Modal from "react-modal";
import { useBettingContext } from "../../contexts/BettingContext";
import { FC } from "react";
import clsx from "clsx";
import { connectWallet } from "../../utils/interact";
import { useContractInteractionContext } from "../../contexts/ContractInteractionContext";
import { BasicModal } from "../../components/modals/BasicModal";
import { OutlineButton } from "../../components/buttons/OutlineButton";

const ModalPrizePool: FC = () => {
  const { leelaPrizePoolAmount, worldPrizePoolAmount } = useBettingContext();

  const denominator = leelaPrizePoolAmount + worldPrizePoolAmount;
  const leelaPrizePoolPercentage =
    denominator === 0 ? 50 : (100 * leelaPrizePoolAmount) / denominator;
  const worldPrizePoolPercentage =
    denominator === 0 ? 50 : (100 * worldPrizePoolAmount) / denominator;
  return (
    <div className="relative h-full w-full bg-[url(/PrizePool.png)] bg-contain bg-no-repeat text-4xl">
      <p
        className="bg-transparent"
        style={{ fontSize: 20, color: "white", marginLeft: 200, marginTop: 5 }}
      >
        {`${(leelaPrizePoolAmount + worldPrizePoolAmount).toFixed(2)} MATIC`}
      </p>
      <div className="top-[48px] left-[0px] h-[35px] w-full px-[17px]">
        <p
          className="left-[50px] bg-transparent"
          style={{ fontSize: 20, color: "white", marginLeft: 10 }}
        >
          {`${leelaPrizePoolPercentage.toFixed(
            2
          )}% Leela | ${worldPrizePoolPercentage.toFixed(2)}% World`}
        </p>
      </div>
    </div>
  );
};

const ButtonVariants: Variants = {
  initial: {
    filter: "brightness(100%)",
    scale: 1,
  },
  tap: {
    filter: "brightness(85%)",
    scale: 0.99,
  },
};

type EndGameModalButtonProps = {
  buttonImageUrl: React.ComponentProps<"button">["className"];
  onClick: any;
};

export const EndGameModalButton: FC<EndGameModalButtonProps> = ({
  buttonImageUrl,
  onClick,
}) => {
  return (
    <div style={{ flex: 1, display: "flex" }}>
      <button onClick={onClick}>
        <img
          style={{ flexGrow: 1, display: "flex", maxWidth: 250, minWidth: 100 }}
          src={buttonImageUrl}
        ></img>
      </button>
    </div>
  );
};

// --- To display messages to user ---
export const EndGameModal = () => {
  const { showEndGameModal, setShowEndGameModal, claimPayout } =
    useBettingContext();

  const { walletAddr, setWalletAddr, setEthersProvider } =
    useContractInteractionContext();

  return (
    <BasicModal>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            marginBottom: 20,
          }}
        >
          <img
            style={{ flex: 1, display: "flex" }}
            src={"/leela_logo.png"}
          ></img>
          <span
            style={{
              flex: 1,
              display: "flex",
              alignSelf: "flex-end",
              fontSize: 20,
            }}
          >
            {" won!"}
          </span>
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
          <span style={{ fontSize: 15, marginBottom: 10 }}>
            {"YOU'RE BETWEEN GAMES!"}
          </span>
          <span style={{ fontSize: 15, marginBottom: 10 }}>
            {
              "- If you staked and lost your bet, come back in 24 hrs for your redemption arc!"
            }
          </span>
          <span style={{ fontSize: 15, marginBottom: 10 }}>
            {
              "- If you staked and won your bet -- congrats and claim your reward below!"
            }
          </span>
          <span style={{ fontSize: 15, marginBottom: 10 }}>
            {
              "After 24 hours has elapsed, any remaining funds in the betting pool will be forwarded to the next game."
            }
          </span>
          <span style={{ fontSize: 15, marginBottom: 10 }}>
            {
              "A 5% deduction will also be made to pay for gas fees associated with operating the game."
            }
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ModalPrizePool />
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <EndGameModalButton
              buttonImageUrl="claim_reward_button.png"
              onClick={() => {
                if (walletAddr === "") {
                  alert("Oops! Connect your wallet first!");
                  return;
                }

                // --- TODO(ryancao): Informative modal? ---
                const onFinish = () => {
                  alert("Congrats! You just claimed your payout!");
                  setShowEndGameModal(false);
                };
                const onError = (error: any) => {
                  alert(`Error claiming your payout: ${error}`);
                };
                claimPayout(onFinish, onError);
              }}
            />
            {walletAddr === "" ? (
              <EndGameModalButton
                buttonImageUrl="connect_wallet_modal_button.png"
                onClick={() => {
                  connectWallet().then(({ status, address, provider }) => {
                    if (address !== null && provider !== null) {
                      setWalletAddr(address);
                      setEthersProvider(provider);
                    } else {
                      // Do nothing in case of failure?
                    }
                  });
                }}
              />
            ) : (
              <span style={{ fontSize: 10 }}>
                {`Connected wallet: ${walletAddr}`}
              </span>
            )}
          </div>
        </div>

        <OutlineButton
          text="Dismiss"
          onClick={() => {
            setShowEndGameModal(false);
          }}
          className="mx-auto"
        />
      </div>
    </BasicModal>
  );
};
