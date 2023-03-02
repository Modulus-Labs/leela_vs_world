import Modal from "react-modal";
import { useArcadeMachineContext } from "../../contexts/ArcadeMachineContext";
import { BasicModal } from "../../components/modals/BasicModal";
import { OutlineButton } from "../../components/buttons/OutlineButton";

// --- To display messages to user ---
export const DisclosureModal = () => {
  const { showDisclosureModal, setShowDisclosureModal } =
    useArcadeMachineContext();

  return (
    <BasicModal>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* --- TODO(ryancao): Change the link --- */}
        <span style={{ fontSize: 20, marginBottom: 20 }}>
          {"THIS IS NOT INVESTMENT ADVICE"}
        </span>

        <span style={{ fontSize: 15, marginBottom: 20 }}>
          {
            "The Content is for informational purposes only, you should not construe any such information or other material as legal, tax, investment, financial, or other advice. Nothing contained on our Site constitutes a solicitation, recommendation, endorsement, or offer by Modulus Labs or any third party service provider to buy or sell any securities, cryptocurrencies, or other financial instruments in this or in in any other jurisdiction in which such solicitation or offer would be unlawful under the securities laws of such jurisdiction."
          }
          {
            "All Content on this site is information of a general nature and does not address the circumstances of any particular individual or entity. Nothing in the Site constitutes professional and/or financial advice, nor does any information on the Site constitute a comprehensive or complete statement of the matters discussed or the law relating thereto. Modulus is not a fiduciary by virtue of any person’s use of or access to the Site or Content. You alone assume the sole responsibility of evaluating the merits and risks associated with the use of any information, interface, or other Content on the Site before making any decisions based on such information or other Content. In exchange for using the Site, you agree not to hold Modulus Lab, its affiliates or any third party service provider liable for any possible claim for damages arising from any decision you make based on information or other Content made available to you through the Site."
          }
        </span>

        <OutlineButton
          text="Got it; let's play!"
          onClick={() => {
            setShowDisclosureModal(false);
          }}
          className="mx-auto"
        />
      </div>
    </BasicModal>
  );
};