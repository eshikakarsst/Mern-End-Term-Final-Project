import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = async data => {
    setError("");
    try {
      await login(data.email, data.password);
      navigate("/groups");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't sign you in. Check your details and try again.");
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1080px] items-center gap-8 px-5 py-10 md:grid-cols-[1fr_420px] md:px-8">
      <section className="hidden overflow-hidden rounded-[28px] bg-[#252c58] p-10 text-white md:block lg:p-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#b8befc]">Your next study session</p>
        <h1 className="mt-5 max-w-lg font-[Manrope] text-4xl font-extrabold leading-tight tracking-[-.04em] lg:text-5xl">Starts with a team that keeps you going.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-[#d3d6ea]">Bring your goals, group, and study plan together. Make progress feel a little less like doing it alone.</p>
        <div className="mt-12 flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden="true">
            {["A", "J", "M", "S"].map((letter, index) => <span key={letter} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#252c58] text-xs font-bold ${index % 2 ? "bg-[#d5dcff] text-[#535fc2]" : "bg-[#c6eddf] text-[#32735e]"}`}>{letter}</span>)}
          </div>
          <span className="text-xs text-[#d3d6ea]">Better study habits, together.</span>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="surface mx-auto w-full max-w-[440px] p-7 sm:p-9">
        <p className="page-eyebrow">Welcome back</p>
        <h2 className="mt-2 font-[Manrope] text-2xl font-extrabold tracking-[-.04em] text-[#252a35]">Sign in to your space</h2>
        <p className="mt-2 text-sm text-[#858b99]">Pick up where you left off with your study group.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-3 py-2.5 text-sm text-[#a14843]">{error}</p>}
        <label className="mt-6 block text-sm font-semibold text-[#4c5260]">
          Email address
          <input {...register("email")} type="email" autoComplete="email" placeholder="you@example.com" required className="field mt-2" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-[#4c5260]">
          Password
          <input {...register("password")} type="password" autoComplete="current-password" placeholder="Your password" required className="field mt-2" />
        </label>
        <button type="submit" disabled={isSubmitting} className="primary-button focus-ring mt-6 w-full">{isSubmitting ? "Signing in..." : "Sign in"}</button>
        <p className="mt-6 text-center text-sm text-[#858b99]">New to StudySync? <Link to="/register" className="font-bold text-[#5865d8] hover:underline">Create an account</Link></p>
      </form>
    </main>
  );
}
