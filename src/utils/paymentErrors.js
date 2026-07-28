/**
 * Maps raw API payment/booking errors to user-friendly i18n messages.
 */
export function getFriendlyPaymentError(rawError, t) {
  if (!rawError || typeof rawError !== 'string') {
    return t('booking.paymentCouldNotStart');
  }

  const msg = rawError.toLowerCase();

  if (msg.includes('hold') || msg.includes('temporarily reserved')) {
    return t('booking.slotTemporarilyReserved');
  }
  if (msg.includes('time slot is no longer available')) {
    return t('offers.slotNoLongerAvailable');
  }
  if (msg.includes('pending_payment') || msg.includes('no longer available for payment')) {
    return t('booking.paymentUnavailable');
  }
  if (msg.includes('booking not found')) {
    return t('booking.bookingNotFound');
  }
  if (msg.includes('already authorized')) {
    return t('booking.paymentAlreadyAuthorized');
  }
  if (msg.includes('mollie payout') || msg.includes('payout setup') || msg.includes('offering sessions')) {
    return t('booking.creatorPayoutNotReady');
  }
  if (msg.includes('not configured') || msg.includes('api key')) {
    return t('booking.paymentNotConfigured');
  }
  if (
    msg.includes('cannot create payment') ||
    msg.includes('current status:') ||
    msg.includes('status must be')
  ) {
    return t('booking.paymentCouldNotStart');
  }

  if (rawError.length < 120 && !rawError.includes("'")) {
    return rawError;
  }

  return t('booking.paymentCouldNotStart');
}
