export function getAuthErrorMessage(error: any, mode: "login" | "register" | "reset" = "login") {
    const code = String(error?.code || error?.message || "");
    console.error("Firebase auth error:", code);

    switch (code) {
        case "auth/email-already-in-use":
            return "This email is already registered. Please sign in instead, or use a different email.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/missing-email":
            return "Please enter your email address.";
        case "auth/missing-password":
            return "Please enter your password.";
        case "auth/weak-password":
            return "Password is too weak. Please use at least 6 characters.";
        case "auth/user-not-found":
            return "No account was found with this email. Please check the email or create a new account.";
        case "auth/wrong-password":
            return "Wrong password. Please try again or reset your password.";
        case "auth/invalid-credential":
            return "Incorrect email or password. Please check your details and try again.";
        case "auth/user-disabled":
            return "This account has been disabled. Please contact support.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please wait a few minutes, then try again.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection and try again.";
        case "auth/popup-closed-by-user":
            return "Sign-in was closed before it finished.";
        case "auth/requires-recent-login":
            return "Please sign in again before continuing.";
        default:
            return mode === "register"
                ? "Could not create your account. Please check your details and try again."
                : mode === "reset"
                    ? "Could not send the reset email. Please check the address and try again."
                    : "Could not sign you in. Please check your details and try again.";
    }
}
