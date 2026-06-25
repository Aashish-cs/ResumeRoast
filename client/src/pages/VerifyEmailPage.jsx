import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying email");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const data = await apiRequest("/auth/verify-email", {
          method: "POST",
          body: { token },
          token: null
        });
        setStatus("success");
        setMessage(data.message);
      } catch (requestError) {
        setStatus("error");
        setMessage(requestError.message);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="panel p-6 text-center">
        {status === "loading" && (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-600" />
        )}
        {status === "success" && (
          <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600" />
        )}
        {status === "error" && <XCircle className="mx-auto h-10 w-10 text-red-600" />}
        <h1 className="mt-4 text-2xl font-black">Email verification</h1>
        <p className="mt-2 text-zinc-600">{message}</p>
        <Link to="/login" className="button-primary mt-6 w-full">
          Go to login
        </Link>
      </div>
    </section>
  );
};

export default VerifyEmailPage;
