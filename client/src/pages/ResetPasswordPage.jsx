import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

const ResetPasswordPage = () => {
  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="panel p-6">
        <KeyRound className="h-8 w-8 text-orange-600" />
        <h1 className="mt-4 text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Password reset now uses your account security question.
        </p>

        <Link to="/forgot-password" className="button-primary mt-6 w-full">
          Answer security question
        </Link>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
