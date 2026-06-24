import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FileDown, Mail, Send, CheckCircle } from 'lucide-react'

// Validation Schema
const contactSchema = z.object({
  name: z.string().min(2, { message: 'IDENTIFIER MUST BE AT LEAST 2 CHARACTERS' }),
  email: z.string().email({ message: 'INVALID TELEMETRY ADDRESS (EMAIL)' }),
  message: z.string().min(10, { message: 'MESSAGE BEACON MUST BE AT LEAST 10 CHARACTERS' }),
})

type ContactInputs = z.infer<typeof contactSchema>

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactInputs>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (_data: ContactInputs) => {
    setIsSubmitting(true)
    // Simulate space network delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setSubmitSuccess(true)
    reset()
    // Reset success banner after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  return (
    <section id="contact" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 overflow-hidden bg-space-dark/20">
      <div className="absolute inset-0 hud-grid pointer-events-none opacity-20" />

      <div className="w-full max-w-5xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Social/Resume widgets */}
        <div className="lg:col-span-5 text-left space-y-8">
          <div className="space-y-4">
            <h2 className="text-xs tracking-widest text-cyan-glow font-orbitron uppercase font-bold text-glow-cyan">
              [ SECTION_04 // SECURE_UPLINK ]
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold font-orbitron text-white">
              ESTABLISH CONTACT
            </h3>
            <p className="text-sm text-gray-400 font-light leading-relaxed max-w-sm">
              Fired up for partnerships, satellite telemetry networks, or software engineering operations. Drop a transmission beacon.
            </p>
          </div>

          {/* Contact Details Cards */}
          <div className="space-y-4">
            <div className="hud-panel p-4 border-glow-cyan flex items-center gap-4 text-xs font-mono text-gray-300">
              <Mail className="w-4 h-4 text-cyan-glow" />
              <span>CHANDER // CS_COGNITIVE@GMAIL.COM</span>
            </div>

            {/* Social Network Downlinks */}
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded border border-hud-border flex items-center justify-center text-gray-400 hover:border-cyan-glow hover:text-cyan-glow hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all duration-300 cursor-pointer bg-space-black/50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded border border-hud-border flex items-center justify-center text-gray-400 hover:border-cyan-glow hover:text-cyan-glow hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all duration-300 cursor-pointer bg-space-black/50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>

            {/* Resume Downlink */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                alert('Downlinking sample resume bundle...')
              }}
              className="inline-flex items-center gap-3 px-5 py-3 border border-cyan-glow text-cyan-glow text-xs font-orbitron tracking-widest uppercase rounded hover:bg-cyan-glow hover:text-space-black transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.1)] cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              DOWNLINK RESUME.PDF
            </a>
          </div>
        </div>

        {/* Right Column: Schema Contact Form */}
        <div className="lg:col-span-7 w-full">
          <div className="hud-panel p-6 md:p-8 border-glow-cyan bg-space-black/80">
            <h4 className="text-xs font-orbitron tracking-wider text-cyan-glow uppercase border-b border-hud-border pb-3 mb-6 font-semibold">
              TRANSMIT SECURE DATA PACKET
            </h4>

            {submitSuccess && (
              <div className="mb-6 p-4 border border-green-500/30 bg-green-500/5 text-green-400 text-xs font-mono rounded flex items-center gap-3 animate-cyber-flicker">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>UPLINK COMPLETED: PACKET DELIVERED TO COGNITIVE COMMAND NODE.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Name Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">
                  IDENTIFIER NAME
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="E.G. PILOT ARMSTRONG"
                  className={`w-full bg-space-black border px-4 py-3 text-xs font-mono text-white rounded focus:outline-none transition-all duration-300 ${
                    errors.name
                      ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'border-hud-border focus:border-cyan-glow focus:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  }`}
                />
                {errors.name && (
                  <span className="text-[9px] text-red-400 font-mono uppercase tracking-wide">
                    * {errors.name.message}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">
                  TELEMETRY ADDR (EMAIL)
                </label>
                <input
                  type="text"
                  {...register('email')}
                  placeholder="E.G. PILOT@NODE.COMM"
                  className={`w-full bg-space-black border px-4 py-3 text-xs font-mono text-white rounded focus:outline-none transition-all duration-300 ${
                    errors.email
                      ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'border-hud-border focus:border-cyan-glow focus:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  }`}
                />
                {errors.email && (
                  <span className="text-[9px] text-red-400 font-mono uppercase tracking-wide">
                    * {errors.email.message}
                  </span>
                )}
              </div>

              {/* Message Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block">
                  TRANSMISSION PAYLOAD
                </label>
                <textarea
                  rows={4}
                  {...register('message')}
                  placeholder="WRITE TELEMETRY OR MESSAGE DETAILS..."
                  className={`w-full bg-space-black border px-4 py-3 text-xs font-mono text-white rounded focus:outline-none transition-all duration-300 resize-none ${
                    errors.message
                      ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'border-hud-border focus:border-cyan-glow focus:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  }`}
                />
                {errors.message && (
                  <span className="text-[9px] text-red-400 font-mono uppercase tracking-wide">
                    * {errors.message.message}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-cyan-glow text-space-black font-orbitron font-semibold text-xs tracking-widest uppercase rounded hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-space-black border-t-transparent rounded-full animate-spin" />
                    TRANSMITTING LUNAR BEACON...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    SEND TRANSMISSION
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </section>
  )
}
