import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import AuthInput from "../components/ui/AuthInput";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setIsSending(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const result: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not send your message.");
      setNotice(result.message || "Your message has been received.");
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send your message.");
    } finally { setIsSending(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-600">
            We're here to help
          </p>

          <h1 className="mt-3 text-4xl font-black text-gray-950 sm:text-5xl">
            Contact Us
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Have a question about a product or an order? Send us a message
            and we'll help you find an answer.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Contact information */}
          <section className="rounded-2xl bg-black p-8 text-white sm:p-10">
            <h2 className="text-2xl font-bold">Get in touch</h2>

            <p className="mt-3 leading-7 text-gray-300">
              We'd love to hear from you. Contact our team with your questions
              or feedback.
            </p>

            <div className="mt-10 space-y-7">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Mail size={22} />
                </span>

                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Contact details coming soon
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <MapPin size={22} />
                </span>

                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Ghana
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <MessageCircle size={22} />
                </span>

                <div>
                  <h3 className="font-semibold">Customer support</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    We're working on our support channels.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/products"
              className="mt-10 inline-flex items-center font-semibold text-yellow-400 hover:text-yellow-300"
            >
              Continue shopping →
            </Link>
          </section>

          {/* Contact form */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-gray-950">
              Send us a message
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Fill in the form below.
            </p>

            {notice && (
              <div
                role="status"
                className="mt-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900"
              >
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <AuthInput
                label="Full name"
                name="name"
                placeholder="Enter your name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <AuthInput
                label="Email address"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <AuthInput
                label="Subject"
                name="subject"
                placeholder="What is your message about?"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
              />

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 font-bold text-black transition hover:bg-yellow-500"
              >
                {isSending ? "Sending…" : "Send Message"}
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
