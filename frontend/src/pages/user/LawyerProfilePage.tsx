import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Briefcase, Globe, BadgeCheck, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { DEMO_LAWYERS } from '../../utils/demoData';
import { Card, Button, Badge, Alert, Modal, Textarea } from '../../components/common';
import { getVerificationStatusColor, getVerificationStatusLabel } from '../../utils/helpers';

const LawyerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const lawyer = DEMO_LAWYERS.find((l) => l.id === id) ?? DEMO_LAWYERS[0];

  const [consultModalOpen, setConsultModalOpen] = useState(searchParams.get('request') === 'true');
  const [consultMessage, setConsultMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultMessage.trim()) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setConsultModalOpen(false);
    setRequestSent(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link to="/user/lawyers" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Find a Lawyer
      </Link>

      {requestSent && (
        <Alert variant="success" icon={<BadgeCheck className="w-4 h-4" />} title="Consultation Request Sent">
          Your request has been sent to {lawyer.name}. (Note: This is a local-state demo — no backend call was made.)
        </Alert>
      )}

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {lawyer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-100">{lawyer.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(lawyer.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{lawyer.rating}</span>
                  <span className="text-xs text-slate-500">({lawyer.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getVerificationStatusColor(lawyer.verificationStatus)}>
                  {getVerificationStatusLabel(lawyer.verificationStatus)}
                </Badge>
                {lawyer.availability ? (
                  <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60">Available</Badge>
                ) : (
                  <Badge className="bg-slate-800 text-slate-500 border-slate-700">Unavailable</Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-3 leading-relaxed">{lawyer.bio}</p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-sky-400" />{lawyer.location}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-sky-400" />{lawyer.experience} years experience</span>
              {lawyer.languages && (
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-sky-400" />{lawyer.languages.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Specializations & Bar Council */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Specializations</h2>
          <div className="flex flex-wrap gap-2">
            {lawyer.specializations.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300">{s}</span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Bar Council Information</h2>
          {lawyer.barCouncilNumber ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-mono text-xs">{lawyer.barCouncilNumber}</span>
              </div>
              <p className="text-xs text-slate-500">
                Verification status reflects admin review. Do not independently rely on this for verification.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="w-4 h-4" />
              Bar Council number not provided.
            </div>
          )}
        </Card>
      </div>

      {/* Request Consultation */}
      {lawyer.availability && !requestSent && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Request a Consultation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Send a consultation request with details about your case.</p>
            </div>
            <Button
              variant="primary"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={() => setConsultModalOpen(true)}
              id="request-consultation-btn"
            >
              Request Consultation
            </Button>
          </div>
        </Card>
      )}

      {!lawyer.availability && (
        <Alert variant="warning" icon={<Clock className="w-4 h-4" />}>
          {lawyer.name} is currently marked as unavailable. You can still view their profile and check back later.
        </Alert>
      )}

      {/* Consultation Modal */}
      <Modal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        title="Request Consultation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConsultModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleRequestConsultation}
              isLoading={isLoading}
              id="confirm-consultation-btn"
              disabled={!consultMessage.trim()}
            >
              Send Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Requesting consultation with <strong className="text-slate-200">{lawyer.name}</strong>.
          </p>
          <Textarea
            label="Message / Case Description"
            id="consult-message"
            value={consultMessage}
            onChange={(e) => setConsultMessage(e.target.value)}
            placeholder="Briefly describe your legal matter and what you need help with…"
            rows={4}
          />
          <Alert variant="warning">
            This sends a demo request (local state only). Real consultation booking requires backend integration.
          </Alert>
        </div>
      </Modal>
    </div>
  );
};

export default LawyerProfilePage;
