import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Linkedin, Mail, Phone, Code, BookOpen, Briefcase, Award, Globe, Heart, Layers } from 'lucide-react';
import { teamMembers } from '../data/teamMembers';
import SkillBadge from '../components/SkillBadge';
import Timeline from '../components/Timeline';
import ProjectCard from '../components/ProjectCard';
import EducationCard from '../components/EducationCard';
import CertificationCard from '../components/CertificationCard';
import InterestChip from '../components/InterestChip';
import SEO from '../components/common/SEO';

export const TeamProfile = () => {
  const { developerId } = useParams();
  const navigate = useNavigate();

  // Find the requested member based on slug
  const member = teamMembers.find((m) => m.slug === developerId);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [developerId]);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Developer Profile Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const hasSkills = member.skills && Object.keys(member.skills).length > 0;
  const hasExperience = member.experience && member.experience.length > 0;
  const hasProjects = member.projects && member.projects.length > 0;
  const hasEducation = member.education && member.education.length > 0;
  const hasCertifications = member.certifications && member.certifications.length > 0;
  const hasLanguages = member.languages && member.languages.length > 0;
  const hasInterests = member.interests && member.interests.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8 pb-16 dark:text-slate-300"
    >
      <SEO title={`${member.name} | Developer Profile`} robots="noindex,nofollow" />
      {/* Top Section: Back Button */}
      <div className="flex justify-between items-center">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </motion.button>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-brand-500 to-indigo-600 dark:from-teal-650 dark:via-brand-650 dark:to-indigo-750 p-6 md:p-8 text-white shadow-xl border border-slate-100/10">
        {/* Background light glow design */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          {/* Circular Image Container */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-teal-300 to-indigo-300 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src={member.image}
              alt={member.name}
              className="relative h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white/95 dark:border-slate-900/95 object-cover shadow-lg"
            />
          </div>

          {/* User Bio Header Info */}
          <div className="flex-1 text-center md:text-left pt-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                {member.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 border border-white/10 uppercase tracking-wider">
                {member.badge}
              </span>
            </div>

            <p className="text-sm md:text-md text-white/95 font-semibold mt-1">
              {member.role} • <span className="italic">{member.title}</span>
            </p>

            {member.location && (
              <p className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-white/75 font-semibold mt-3">
                <MapPin size={12} />
                <span>{member.location}</span>
              </p>
            )}

            {/* Social Contact Anchors */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-5">
              {member.contacts.linkedin && (
                <a
                  href={`https://${member.contacts.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                >
                  <Linkedin size={13} className="text-indigo-650" />
                  LinkedIn
                </a>
              )}
              {member.contacts.email && (
                <a
                  href={`mailto:${member.contacts.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                >
                  <Mail size={13} className="text-brand-600" />
                  Email
                </a>
              )}
              {member.contacts.phone && (
                <a
                  href={`tel:${member.contacts.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                >
                  <Phone size={13} className="text-teal-650" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Blocks Layout */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Professional Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-4">
            Professional Summary
          </h2>
          <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
            {member.summary}
          </p>
        </div>

        {/* Technical Skills grouped by Category */}
        {hasSkills && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-1.5">
              <Layers size={14} className="text-brand-500" /> Technical Skills
            </h2>
            <div className="space-y-5">
              {Object.entries(member.skills).map(([category, skillList]) => (
                <div key={category} className="flex flex-col gap-2.5 md:flex-row md:items-start">
                  <span className="text-xs font-extrabold text-slate-450 dark:text-slate-500 min-w-[130px] pt-1 leading-normal">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {skillList.map((skill, index) => (
                      <SkillBadge key={index} skill={skill} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Timeline */}
        {hasExperience && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-1.5">
              <Briefcase size={14} className="text-brand-500" /> Professional Experience
            </h2>
            <Timeline items={member.experience} />
          </div>
        )}

        {/* Key Projects Grid */}
        {hasProjects && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-5 flex items-center gap-1.5">
              <Code size={14} className="text-brand-500" /> Key Project History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {member.projects.map((proj, idx) => (
                <ProjectCard
                  key={idx}
                  name={proj.name}
                  description={proj.description}
                  tech={proj.tech}
                />
              ))}
            </div>
          </div>
        )}

        {/* Education Details */}
        {hasEducation && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-1.5">
              <BookOpen size={14} className="text-brand-500" /> Academic Background
            </h2>
            <div className="space-y-4">
              {member.education.map((edu, idx) => (
                <EducationCard
                  key={idx}
                  degree={edu.degree}
                  institution={edu.institution}
                  gpa={edu.gpa}
                  details={edu.details}
                />
              ))}
            </div>
          </div>
        )}

        {/* Certifications Course lists */}
        {hasCertifications && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-1.5">
              <Award size={14} className="text-brand-500" /> Licenses & Certifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {member.certifications.map((cert, idx) => (
                <CertificationCard key={idx} name={cert.name} />
              ))}
            </div>
          </div>
        )}

        {/* Extra Responsibilities (NCC / NGO) */}
        {member.responsibilities && member.responsibilities.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-3.5">
              Positions of Responsibility
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-650 dark:text-slate-350 font-medium">
              {member.responsibilities.map((resp, idx) => (
                <li key={idx} className="leading-relaxed">{resp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages & Interests Footer Blocks */}
        {(hasLanguages || hasInterests) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Languages */}
              {hasLanguages && (
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2 border-slate-100 dark:border-slate-800 mb-3 flex items-center gap-1">
                    <Globe size={13} className="text-brand-500" /> Languages
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 text-slate-650 dark:text-slate-300 rounded-xl border border-slate-150/40 dark:border-slate-800 shadow-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {hasInterests && (
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b pb-2 border-slate-100 dark:border-slate-800 mb-3 flex items-center gap-1">
                    <Heart size={13} className="text-brand-500" /> Hobbies & Interests
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.interests.map((interest, index) => (
                      <InterestChip key={index} interest={interest} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default TeamProfile;
