import BN = require("bn.js");
import {
  getActiveValidatorIndices, getAttestationParticipants,
  getBlockRoot, getCrosslinkCommitteesAtSlot, getCurrentEpoch, getEpochStartSlot, getPreviousEpoch, getTotalBalance,
  slotToEpoch
} from "../../helpers/stateTransitionHelpers";
import {
  Attestation, BeaconState, CrosslinkCommittee, Epoch, Gwei, PendingAttestation,
  ValidatorIndex
} from "../../types";

export function processVariables(state: BeaconState) {
  // Variables
  const currentEpoch: Epoch = getCurrentEpoch(state);
  const previousEpoch: Epoch = getPreviousEpoch(state);
  const nextEpoch: Epoch = currentEpoch.addn(1);

  // Validators attesting during the current epoch
  const currentTotalBalance: Gwei = getTotalBalance(state, getActiveValidatorIndices(state.validatorRegistry, currentEpoch));
  const currentEpochAttestations: PendingAttestation[] = state.latestAttestations.filter((attestation) => currentEpoch === slotToEpoch(attestation.data.slot));

  // Validators justifying the epoch boundary block at the start of the current epoch
  const currentEpochBoundaryAttestations: PendingAttestation[] = currentEpochAttestations.filter((attestation) => {
    if (attestation.data.epochBoundaryRoot === getBlockRoot(state, getEpochStartSlot(currentEpoch))) {
      return attestation;
    }
  });

  const currentEpochBoundaryAttesterIndices: ValidatorIndex[] = currentEpochBoundaryAttestations
    .map((attestation: PendingAttestation) => getAttestationParticipants(state, attestation.data, attestation.aggregationBitfield))
    .reduce((previousValue: ValidatorIndex[], currentValue: ValidatorIndex[]) => previousValue.concat(...currentValue));

  const currentEpochBoundaryAttestingBalance = getTotalBalance(state, currentEpochBoundaryAttesterIndices);

  // Validators attesting during the previous epoch
  const previousTotalBalance = getTotalBalance(state, getActiveValidatorIndices(state.validatorRegistry, previousEpoch));

  // Validators that made an attestation during the previous epoch, targeting the previous justified slot
  const previousEpochAttestations: PendingAttestation[] = state.latestAttestations.filter((attestation) => {
    if (previousEpoch === slotToEpoch(attestation.data.slot)) {
      return attestation;
    }
  });

  const previousEpochAttesterIndices: ValidatorIndex[] = previousEpochAttestations
    .map((attestation: PendingAttestation) => getAttestationParticipants(state, attestation.data, attestation.aggregationBitfield))
    .reduce((previousValue: ValidatorIndex[], currentValue: ValidatorIndex[]) => previousValue.concat(...currentValue));

  const previousEpochAttestingBalance: Gwei = getTotalBalance(state, previousEpochAttesterIndices);

  // Validators justifying the epoch boundary block at the start of the previous epoch
  const previousEpochBoundaryAttestations: PendingAttestation[] = previousEpochAttestations.filter((attestation) => {
    if (attestation.data.epochBoundaryRoot === getBlockRoot(state, getEpochStartSlot(previousEpoch))) {
      return attestation;
    }
  });

  const previousEpochBoundaryAttesterIndices: ValidatorIndex[] = previousEpochBoundaryAttestations
    .map((attestation) => getAttestationParticipants(state, attestation.data, attestation.aggregationBitfield))
    .reduce((previousValue: ValidatorIndex[], currentValue: ValidatorIndex[]) => previousValue.concat(...currentValue));

  const previousEpochBoundaryAttestingBalance: Gwei = getTotalBalance(state, previousEpochBoundaryAttesterIndices);

  // Validators attesting to the expected beacon chain head during the previous epoch
  const previousEpochHeadAttestations: PendingAttestation[] = previousEpochAttestations.filter((attestation) => {
    if (attestation.data.beaconBlockRoot === getBlockRoot(state, attestation.data.slot)) {
      return attestation;
    }
  });

  const previousEpochHeadAttesterIndices: ValidatorIndex[] = previousEpochAttestations
    .map((attestation) => getAttestationParticipants(state, attestation.data, attestation.aggregationBitfield))
    .reduce((previousValue: ValidatorIndex[], currentValue: ValidatorIndex[]) => previousValue.concat(...currentValue));

  const previousEpochHeadAttestingBalance: Gwei = getTotalBalance(state, previousEpochHeadAttesterIndices);

  // For every slot in range(get_epoch_start_slot(previous_epoch), get_epoch_start_slot(next_epoch)), let crosslink_committees_at_slot = get_crosslink_committees_at_slot(state, slot). For every (crosslink_committee, shard) in crosslink_committees_at_slot, compute:
  //
  // Let shard_block_root be state.latest_crosslinks[shard].shard_block_root
  // Let total_attesting_balance(crosslink_committee) = get_total_balance(state, attesting_validators(crosslink_committee)).
  // TODO Need to finish
  const startSlot = getEpochStartSlot(previousEpoch).toNumber();
  const endSlot = getEpochStartSlot(nextEpoch).toNumber();
  for (let slot = startSlot; slot < endSlot; slot++) {
    const crosslinkCommitteesAtSlot = getCrosslinkCommitteesAtSlot(state, new BN(slot)).map((value: CrosslinkCommittee) => {
      const { shard, validatorIndices } = value;
      const shardBlockRoot = state.latestCrosslinks[shard.toNumber()];

    })
  }

  return {
    currentEpoch,
    previousEpoch,
    nextEpoch,
    currentTotalBalance,
    currentEpochAttestations,
    currentEpochBoundaryAttesterIndices,
    currentEpochBoundaryAttestingBalance,
    previousTotalBalance,
    previousEpochAttestations,
    previousEpochAttesterIndices,
    previousEpochAttestingBalance,
    previousEpochBoundaryAttestations,
    previousEpochBoundaryAttesterIndices,
    previousEpochBoundaryAttestingBalance,
    previousEpochHeadAttestations,
    previousEpochHeadAttesterIndices,
    previousEpochHeadAttestingBalance,
  }
}
