import type { Metadata } from "next";
import Link from "next/link";
import { getSignupByPayToken } from "@/lib/hackathonStore";
import { formatUgx, paymentStatus } from "@/lib/hackathon";
import HackathonMomoId from "@/components/HackathonMomoId";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hackathon payment — Pearl AI Labs",
  robots: { index: false, follow: false },
};

// A family's own link (from their email or a WhatsApp message from staff) for adding the MoMo
// transaction ID after registering. Shows only the child's first name and the payment state.
export default async function HackathonPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = getSignupByPayToken(token);
  const first = row?.learnerName.trim().split(/\s+/)[0] ?? "";
  const status = row ? paymentStatus(row) : null;

  return (
    <div className="hp">
      <style>{css}</style>
      <div className="hp-wrap">
        <Link href="/hackathon" className="hp-back">
          ← STEM Innovation Hackathon
        </Link>
        {!row ? (
          <>
            <h1>This link isn&apos;t valid</h1>
            <p>Check that you copied the whole link, or contact us on +256 763 839356.</p>
          </>
        ) : status === "Verified" ? (
          <>
            <h1>Payment confirmed</h1>
            <p>
              We&apos;ve confirmed the {formatUgx(row.amountDue)} hackathon fee for {first}. See you at the ICT Hub.
            </p>
          </>
        ) : status === "Awaiting check" ? (
          <>
            <h1>We have your transaction ID</h1>
            <p>
              We received MoMo transaction ID <strong>{row.transactionId}</strong> for {first} and will confirm once
              we&apos;ve matched it to our statement. Made a mistake? Enter the right one below.
            </p>
            <HackathonMomoId token={token} learnerName={first} />
          </>
        ) : (
          <>
            <h1>Add your MoMo transaction ID</h1>
            <p>{first} is registered. Add the transaction ID below so we can match your payment.</p>
            <HackathonMomoId token={token} learnerName={first} />
          </>
        )}
        <p className="hp-help">Questions? Call +256 763 839356 or email pearllabsug@gmail.com.</p>
      </div>
    </div>
  );
}

const css = `
.hp{ min-height:100vh; background:#F4FAFF; color:#111D23; font-family:var(--font-body),system-ui,sans-serif; }
.hp-wrap{ max-width:560px; margin:0 auto; padding:64px 16px 40px; text-align:center; }
.hp-back{ display:inline-block; color:#4C616C; text-decoration:none; font-size:13px; margin-bottom:28px; }
.hp h1{ font-family:var(--font-heading),sans-serif; font-size:clamp(28px,6vw,40px); font-weight:800; letter-spacing:-.02em; color:#002D5B; margin:0 0 12px; }
.hp p{ font-size:15.5px; line-height:1.7; color:#4C616C; margin:0 0 22px; }
.hp p.hp-help{ font-size:12.5px; margin-top:8px; }
`;
