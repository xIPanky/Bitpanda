import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Zap, BarChart3, CheckCircle2, Smartphone, Shield, Rocket, Users, Mail } from 'lucide-react';

export default function Landing() {
  const [email, setEmail] = useState('');

  return (
    <div style={{ background: '#070707' }} className="min-h-screen text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4" style={{ background: 'rgba(7, 7, 7, 0.95)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#beff00' }}>
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-widest uppercase">Synergy</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-[#beff00] transition">Funktionen</a>
            <a href="#how-it-works" className="text-sm hover:text-[#beff00] transition">Wie es funktioniert</a>
            <a href="#trust" className="text-sm hover:text-[#beff00] transition">Über uns</a>
            <Link to={createPageUrl('OrganizerRegistration')} className="px-4 py-2 rounded-lg" style={{ background: '#beff00', color: '#070707' }}>
            <span className="text-sm font-bold">Veranstalter werden</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:pt-48 md:pb-32" style={{ background: 'linear-gradient(135deg, #070707 0%, #0d1a00 100%)' }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8" style={{ background: 'rgba(190, 255, 0, 0.1)', border: '1px solid rgba(190, 255, 0, 0.2)' }}>
              <Rocket className="w-4 h-4" style={{ color: '#beff00' }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: '#beff00' }}>Für moderne Veranstalter</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              Die Ticketplattform
              <br />
              <span style={{ color: '#beff00' }}>für moderne</span>
              <br />
              Veranstalter.
            </h1>

            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-md">
              Verkaufe Tickets, automatisiere Prozesse und manage deine Events professionell – alles an einem Ort.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Link
                to={createPageUrl('OrganizerRegistration')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition hover:shadow-lg"
                style={{ background: '#beff00', color: '#070707', boxShadow: '0 0 20px rgba(190, 255, 0, 0.2)' }}
              >
                Jetzt Veranstalter werden <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold border transition hover:bg-white/5"
                style={{ borderColor: '#beff00', color: '#beff00' }}
              >
                Plattform entdecken <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', boxShadow: '0 0 40px rgba(190, 255, 0, 0.1)' }}
              >
                <div className="aspect-square flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' }}>
                  <div className="text-center">
                    <BarChart3 className="w-24 h-24 mx-auto mb-4 text-[#beff00] opacity-30" />
                    <p className="text-gray-500 text-sm">Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-xl border"
                style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}
              >
                <div className="p-4 text-center text-xs text-gray-400">
                  <div className="font-bold mb-2" style={{ color: '#beff00' }}>2,500+</div>
                  <p>Events verwaltet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="features" className="py-20 px-6 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Mehr verkaufen.
              <br />
              <span style={{ color: '#beff00' }}>Weniger Aufwand.</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Unsere Plattform wurde für echte Event-Profis entwickelt. Von Clubnächten bis Creator Events – du bekommst alle Tools, um dein Event effizient zu verkaufen und zu verwalten.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: 'Schnell starten',
                description: 'Event erstellen und innerhalb weniger Minuten live gehen.',
              },
              {
                icon: Mail,
                title: 'Automatisierte Ticketprozesse',
                description: 'Tickets werden automatisch generiert und professionell versendet.',
              },
              {
                icon: BarChart3,
                title: 'Volle Kontrolle',
                description: 'Echtzeit-Insights über Verkäufe, Gäste und Performance.',
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-xl border transition hover:border-[#beff00]/50 hover:bg-white/5"
                  style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ background: 'rgba(190, 255, 0, 0.1)' }}>
                    <IconComponent className="w-6 h-6" style={{ color: '#beff00' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 px-6 md:py-32" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(190, 255, 0, 0.05) 100%)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            So sieht modernes
            <br />
            <span style={{ color: '#beff00' }}>Eventmanagement aus.</span>
          </h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Alles in einer klaren Oberfläche. Kein Chaos. Keine externen Tools.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Dashboard', icon: BarChart3, color: '#beff00' },
              { title: 'Gästemanagement', icon: Users, color: '#beff00' },
              { title: 'Ticketübersicht', icon: Mail, color: '#beff00' },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border overflow-hidden transition hover:border-[#beff00] hover:shadow-lg"
                  style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', boxShadow: 'hover:0 0 20px rgba(190, 255, 0, 0.2)' }}
                >
                  <div className="aspect-video flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)' }}>
                    <IconComponent className="w-16 h-16 text-gray-600" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-20 px-6 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Gebaut für Veranstalter,
              <br />
              <span style={{ color: '#beff00' }}>die professionell arbeiten.</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Egal ob Club, Festival oder Creator Event – die Plattform passt sich deinem Workflow an.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { icon: Smartphone, label: 'Mobile-ready' },
              { icon: Shield, label: 'Secure ticket delivery' },
              { icon: Rocket, label: 'Automated workflows' },
              { icon: CheckCircle2, label: 'Fast setup' },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(190, 255, 0, 0.1)' }}>
                    <IconComponent className="w-6 h-6" style={{ color: '#beff00' }} />
                  </div>
                  <p className="font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 md:py-32" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              So startest du in
              <br />
              <span style={{ color: '#beff00' }}>wenigen Minuten</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 md:gap-4">
            {[
              { step: '1', title: 'Account erstellen', desc: 'Registriere dich als Veranstalter.' },
              { step: '2', title: 'Event veröffentlichen', desc: 'Lege Preise, Tickets und Details fest.' },
              { step: '3', title: 'Tickets verkaufen', desc: 'Automatisierte Prozesse übernehmen den Rest.' },
              { step: '4', title: 'Event durchführen', desc: 'Gästeliste, Check-In und Kontrolle in Echtzeit.' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div
                  className="p-6 rounded-xl border text-center"
                  style={{ background: '#111', border: '1px solid #1e1e1e' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4 font-black"
                    style={{ background: '#beff00', color: '#070707' }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center z-10">
                    <ArrowRight className="w-5 h-5" style={{ color: '#beff00' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-6 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span style={{ color: '#beff00' }}>Von Veranstaltern</span>
              <br />
              genutzt
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Endlich eine Plattform, die Gästemanagement wirklich einfach macht!',
                author: 'Club Organizer',
              },
              {
                quote: 'Die Ticket-Automation spart mir Stunden pro Event.',
                author: 'Festival Manager',
              },
              {
                quote: 'Professionell, zuverlässig und immer für uns da.',
                author: 'Creator Event Host',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl border"
                style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: '#beff00' }}>★</span>
                  ))}
                </div>
                <p className="text-lg mb-6 text-gray-300">"{item.quote}"</p>
                <p className="font-semibold text-gray-400">{item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 md:py-32" style={{ background: 'linear-gradient(135deg, rgba(190, 255, 0, 0.05) 0%, rgba(190, 255, 0, 0.02) 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Bereit, dein nächstes Event
            <br />
            <span style={{ color: '#beff00' }}>professionell zu verkaufen?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Starte jetzt und bring dein Ticketing auf ein neues Level.
          </p>

          <Link
            to={createPageUrl('OrganizerRegistration')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition hover:shadow-xl"
            style={{
              background: '#beff00',
              color: '#070707',
              boxShadow: '0 0 30px rgba(190, 255, 0, 0.3)',
            }}
          >
            Jetzt kostenlos starten <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#1a1a1a', background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#beff00' }}>
                  <Zap className="w-3 h-3 text-black" />
                </div>
                <span className="font-bold tracking-widest uppercase text-sm">Synergy</span>
              </div>
              <p className="text-xs text-gray-500">Event-Ticketing für Profis.</p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Plattform</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#beff00] transition">Dashboard</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">Funktionen</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">Preise</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Support</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#beff00] transition">Dokumentation</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">Kontakt</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Rechtliches</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#beff00] transition">Impressum</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">Datenschutz</a></li>
                <li><a href="#" className="hover:text-[#beff00] transition">AGB</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-sm text-gray-500" style={{ borderColor: '#1a1a1a' }}>
            <p>© 2026 Synergy. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}