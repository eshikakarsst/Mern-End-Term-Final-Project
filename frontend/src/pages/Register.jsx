import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = async data => {
    setError("");
    try {
      await signUp(data.name, data.email, data.password);
      navigate("/groups");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't create your account. Please try again.");
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1080px] items-center gap-8 px-5 py-10 md:grid-cols-[1fr_420px] md:px-8">
      <section className="hidden overflow-hidden rounded-[28px] bg-[#252c58] p-10 text-white md:block lg:p-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#b8befc]">Make room for progress</p>
        <h1 className="mt-5 max-w-lg font-[Manrope] text-4xl font-extrabold leading-tight tracking-[-.04em] lg:text-5xl">Good things happen when you learn together.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-[#d3d6ea]">Create your account, invite your crew, and make the next study goal one you can actually stick to.</p>
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold">One shared space</p>
          <p className="mt-1 text-xs leading-5 text-[#d3d6ea]">Subjects, topic progress, study sessions, and your whole team in sync.</p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="surface mx-auto w-full max-w-[440px] p-7 sm:p-9">
        <p className="page-eyebrow">Get started</p>
        <h2 className="mt-2 font-[Manrope] text-2xl font-extrabold tracking-[-.04em] text-[#252a35]">Create your account</h2>
        <p className="mt-2 text-sm text-[#858b99]">A better study rhythm starts here.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-3 py-2.5 text-sm text-[#a14843]">{error}</p>}
        <label className="mt-6 block text-sm font-semibold text-[#4c5260]">
          Your name
          <input {...register("name")} autoComplete="name" placeholder="How should we call you?" required maxLength={80} className="field mt-2" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-[#4c5260]">
          Email address
          <input {...register("email")} type="email" autoComplete="email" placeholder="you@example.com" required className="field mt-2" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-[#4c5260]">
          Password
          <input {...register("password")} type="password" autoComplete="new-password" minLength={6} placeholder="At least 6 characters" required className="field mt-2" />
        </label>
        <button type="submit" disabled={isSubmitting} className="primary-button focus-ring mt-6 w-full">{isSubmitting ? "Creating account..." : "Create account"}</button>
        <p className="mt-6 text-center text-sm text-[#858b99]">Already have an account? <Link to="/login" className="font-bold text-[#5865d8] hover:underline">Sign in</Link></p>
      </form>
    </main>
  );
}
