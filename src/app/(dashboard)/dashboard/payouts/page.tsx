import { redirect } from "next/navigation";

// Payouts was a duplicate of the Wallet withdrawal flow that skipped the
// withdrawal verification code check. Wallet is the single source of truth
// for balances and withdrawals now, so this route just forwards there.
export default function PayoutsRedirect() {
    redirect("/dashboard/wallet");
}
