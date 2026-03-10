import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faTimes } from '@fortawesome/free-solid-svg-icons';
import { SiGooglemeet } from "react-icons/si";
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function SchedulingModal({ isOpen, onClose, builderInfo, propertyInfo }) {
    if (!isOpen) return null;

    const handleWhatsAppContact = () => {
        if (builderInfo.phone === 'Loading...') {
            alert('Phone number is still being loaded. Please wait a moment and try again.');
            return;
        }
        const phoneNumber = builderInfo.phone.replace(/\D/g, '');
        if (!phoneNumber) { alert('Builder phone number is not available'); return; }
        const message = `Hi ${builderInfo.name},\n\nI'm interested in scheduling a viewing for "${propertyInfo.title}" at ${propertyInfo.location}.\n\nCould we arrange a convenient time?\n\nBest regards`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handlePhoneCall = () => {
        if (builderInfo.phone === 'Loading...') { alert('Phone number is still loading.'); return; }
        if (!builderInfo.phone || builderInfo.phone === 'Not available') { alert('Builder phone number is not available'); return; }
        window.open(`tel:${builderInfo.phone}`, '_self');
    };

    const handleGoogleMeet = () => {
        const meetingId = Math.random().toString(36).substring(2, 12);
        const meetUrl = `https://meet.google.com/${meetingId}`;
        const title = `Property Viewing - ${propertyInfo.title}`;
        const desc = `Viewing for ${propertyInfo.title} at ${propertyInfo.location}.\nBuilder: ${builderInfo.name} | ${builderInfo.phone}\nMeet: ${meetUrl}`;
        const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(meetUrl)}`;
        window.open(calUrl, '_blank');
        onClose();
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-sm glass p-8 rounded-[40px] border border-white/10 shadow-3xl animate-in zoom-in-95 duration-300"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-dim hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Schedule Visit</h2>
                    <p className="text-xs font-medium text-dim">
                        Connect with <span className="text-white font-bold">{builderInfo.name || 'the builder'}</span> to arrange a viewing.
                    </p>
                </div>

                {/* Property Info Badge */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-10 group hover:bg-white/10 transition-colors">
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">Inquiry for</p>
                    <p className="text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">{propertyInfo?.title}</p>
                    <p className="text-[11px] font-medium text-dim leading-tight">{propertyInfo?.location}</p>
                </div>

                {/* Contact Options */}
                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={handleWhatsAppContact}
                        disabled={!builderInfo.phone || builderInfo.phone === 'Loading...'}
                        className="flex flex-col items-center justify-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-30 group"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} className="text-2xl group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-dim group-hover:text-emerald-400">Chat</span>
                    </button>

                    <button
                        onClick={handlePhoneCall}
                        disabled={!builderInfo.phone || builderInfo.phone === 'Loading...'}
                        className="flex flex-col items-center justify-center gap-3 p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-30 group"
                    >
                        <FontAwesomeIcon icon={faPhone} className="text-xl group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-dim group-hover:text-blue-400">Call</span>
                    </button>

                    <button
                        onClick={handleGoogleMeet}
                        className="flex flex-col items-center justify-center gap-3 p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95 group"
                    >
                        <SiGooglemeet className="text-2xl group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-dim group-hover:text-rose-400">Meet</span>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest opacity-50 italic">Encrypted Secure Inquiries</p>
                </div>
            </div>
        </div>
    );
}

export default SchedulingModal;
