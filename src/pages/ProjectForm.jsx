import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, Loader2, AlertCircle } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PhoneInput } from '../components/PhoneInput';

import { isValidPhoneNumber } from 'libphonenumber-js';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const steps = ['Contact details', 'Project details'];

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const schema = yup.object().shape({
  name: yup.string().required('Enter your full name.'),
  email: yup.string().required('Enter your business email.').matches(emailRegex, 'Enter a valid email address (e.g. name@company.com).'),
  whatsappNumber: yup.string().test('is-valid-phone', 'Enter a valid phone number.', (value) => value ? isValidPhoneNumber(value) : false).required('Phone number is required.'),
  altNumber: yup.string().test('is-valid-alt-phone', 'Enter a valid phone number.', (value) => !value || isValidPhoneNumber(value)),
  assistanceType: yup.string().required('Select how to proceed.'),

  businessName: yup.string().when('assistanceType', {
    is: 'complete_brief',
    then: (s) => s.required('Enter your company name.'),
    otherwise: (s) => s.notRequired(),
  }),
  serviceOffered: yup.string().when('assistanceType', {
    is: 'complete_brief',
    then: (s) => s.required('Enter your product or service.'),
    otherwise: (s) => s.notRequired(),
  }),
  reqSummary: yup.string().when('assistanceType', {
    is: 'complete_brief',
    then: (s) => s.required('Enter a project summary.').max(120, 'Please keep summary to 1 short line (max 120 chars).'),
    otherwise: (s) => s.notRequired(),
  }),
  expectedOutcome: yup.string().when('assistanceType', {
    is: 'complete_brief',
    then: (s) => s.required('Enter expected outcome.').max(120, 'Please keep expected outcome to 1 short line (max 120 chars).'),
    otherwise: (s) => s.notRequired(),
  }),
});

const scriptURL = "https://script.google.com/macros/s/AKfycbxLRftndaH_znmmYtWfL9mmP9hoWXiPaBb8sOGBO5DPXZncXF4hX5akHaMgj8CEcMwW/exec";

const renderErrorMessage = (msg) => {
  if (!msg) return null;
  const match = msg.match(/^(.*?)\s*(\(.*?\)\.?)$/);
  if (match) {
    return (
      <span>
        <span className="font-semibold text-red-700">{match[1]}</span>{' '}
        <span className="font-normal text-red-600/80">{match[2]}</span>
      </span>
    );
  }
  return <span className="font-medium text-red-700">{msg}</span>;
};

const CustomField = ({ label, required, error, helperText, children, htmlFor, maxLength, currentLength }) => (
  <div className="flex flex-col space-y-2 w-full">
    <div className="flex items-center justify-between">
      <Label.Root htmlFor={htmlFor} className="text-[14px] font-medium text-gray-900">
        {label} {required && <span aria-hidden="true" className="text-gray-400 ml-[2px]">*</span>}
      </Label.Root>
      {maxLength !== undefined && (
        <span className={cn("text-[12px] font-medium transition-colors", (currentLength || 0) >= maxLength ? "text-red-500 font-semibold" : "text-gray-400")}>
          {currentLength || 0}/{maxLength}
        </span>
      )}
    </div>
    {children}
    {error ? (
      <div 
        role="alert" 
        className="flex items-center gap-2 mt-1.5 px-3.5 py-2 bg-red-50/90 border border-red-200/80 rounded-xl text-[13.5px] shadow-xs"
      >
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <div>{renderErrorMessage(error.message)}</div>
      </div>
    ) : helperText ? (
      <p className="text-[13px] leading-[1.4] text-gray-500">
        {helperText}
      </p>
    ) : null}
  </div>
);

const inputStyles = "flex h-12 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-[15px] text-gray-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] disabled:cursor-not-allowed disabled:opacity-50";
const textareaStyles = "flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] disabled:cursor-not-allowed disabled:opacity-50 resize-y";

export default function ProjectForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors }, trigger, setValue, watch, getValues } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: JSON.parse(localStorage.getItem('ProjectForm_draft')) || {
      name: '',
      email: '',
      whatsappNumber: '',
      altNumber: '',
      businessName: '',
      serviceOffered: '',
      reqSummary: '',
      expectedOutcome: '',
      assistanceType: 'discuss_team'
    }
  });

  const [leadId, setLeadId] = useState('');
  const assistanceType = watch('assistanceType') || 'discuss_team';
  const totalSteps = assistanceType === 'discuss_team' ? 1 : 2;

  useEffect(() => {
    let timer;
    const subscription = watch((value) => {
      localStorage.setItem('ProjectForm_draft', JSON.stringify(value));
      if (value.whatsappNumber && isValidPhoneNumber(value.whatsappNumber) && leadId) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const partialPayload = {
            action: "submit_partial_lead",
            leadId: leadId,
            name: value.name || "",
            email: value.email || "",
            whatsappNumber: value.whatsappNumber,
            altNumber: value.altNumber || ""
          };
          fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partialPayload)
          }).catch(err => console.error('Failed to log partial draft:', err));
        }, 1200);
      }
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [watch, leadId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLeadId = params.get('lead_id');
    const urlPhone = params.get('phone');
    
    if (urlLeadId) {
      setLeadId(urlLeadId);
    } else {
      setLeadId('L-' + Math.random().toString(36).substr(2, 6).toUpperCase());
    }

    if (urlPhone) {
      let rawPhone = decodeURIComponent(urlPhone).trim();
      let digitsOnly = rawPhone.replace(/\D/g, '');
      let cleanPhone = rawPhone.replace(/\s+/g, '');

      if (cleanPhone.startsWith('+')) {
        // Already formatted with + prefix
      } else if (/^[6-9]\d{9}$/.test(digitsOnly)) {
        cleanPhone = '+91' + digitsOnly;
      } else if (digitsOnly.length > 0) {
        cleanPhone = '+' + digitsOnly;
      }

      if (digitsOnly.length >= 7 && isValidPhoneNumber(cleanPhone)) {
        setValue('whatsappNumber', cleanPhone, { shouldValidate: true });

        // Instantly register draft on Form 1 entrance
        const activeLeadId = urlLeadId || 'L-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const partialPayload = {
          action: "submit_partial_lead",
          leadId: activeLeadId,
          name: "",
          email: "",
          whatsappNumber: cleanPhone,
          altNumber: ""
        };
        fetch(scriptURL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partialPayload)
        }).catch(err => console.error('Failed to log entrance draft:', err));
      }
    }
  }, [setValue]);

  const handleNext = async () => {
    const fieldsToValidate = ['name', 'email', 'whatsappNumber', 'altNumber', 'assistanceType'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      const values = getValues();
      const partialPayload = {
        action: "submit_partial_lead",
        leadId: leadId,
        name: values.name,
        email: values.email,
        whatsappNumber: values.whatsappNumber,
        altNumber: values.altNumber
      };
      fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialPayload)
      }).catch(err => console.error('Failed to log partial draft:', err));

      setActiveStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const firstErrorField = fieldsToValidate.find(f => errors[f]);
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField);
          if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
      }, 50);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onError = (formErrors) => {
    setTimeout(() => {
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }
    }, 50);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    const payload = {
      action: "submit_form",
      leadId: leadId,
      ...data,
      phone: data.whatsappNumber
    };
    
    try {
      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setIsSubmitting(false);
      setIsSuccess(true);
      localStorage.removeItem('ProjectForm_draft');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        const businessPhone = "919962852828";
        window.location.href = `whatsapp://send?phone=${businessPhone}`;
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Failed to send enquiry. Please try again.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[680px] shrink-0 relative rounded-b-2xl md:rounded-b-3xl overflow-hidden shadow-sm">
        <img src="/banner.jfif" alt="Brand Banner" className="w-full h-auto block" />
      </div>

      <div className="w-full max-w-[680px] px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center text-center p-8 md:p-12 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 tracking-tight">
              Enquiry received
            </h2>
            <p className="text-base text-gray-600 mb-8 max-w-[400px]">
              Our team will review your request. You'll usually hear back within one business day.
            </p>
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#b512b8]/10 text-[#b512b8] rounded-xl font-medium text-[14px]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to WhatsApp...
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="mb-10">
              <h1 className="text-3xl md:text-[40px] font-semibold text-gray-900 mb-3 tracking-tight">
                Contact Form
              </h1>
              <p className="text-[17px] text-gray-500 leading-relaxed">
                Provide some details about you. it takes dumbass 3 mins
              </p>
            </div>

            <div className="mb-10">
              <p className="text-[13px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
                Step {activeStep + 1} of {totalSteps}
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {steps[activeStep]}
              </h2>
              <div className="flex gap-2 items-center">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      index <= activeStep ? "bg-[#b512b8]" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
              <AnimatePresence mode="wait">
                {activeStep === 0 && (
                  <motion.div 
                    key="step0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 mb-12"
                  >
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Full name" required htmlFor="name" error={errors.name}>
                          <input 
                            {...field}
                            id="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Jane Doe"
                            aria-invalid={!!errors.name}
                            className={cn(inputStyles, errors.name && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Business email" required htmlFor="email" error={errors.email}>
                          <input 
                            {...field}
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@company.com"
                            aria-invalid={!!errors.email}
                            className={cn(inputStyles, errors.email && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Controller
                        name="whatsappNumber"
                        control={control}
                        render={({ field }) => (
                          <CustomField label="Phone number" required htmlFor="whatsappNumber" error={errors.whatsappNumber}>
                            <PhoneInput
                              {...field}
                              id="whatsappNumber"
                              autoComplete="tel"
                              error={!!errors.whatsappNumber}
                            />
                          </CustomField>
                        )}
                      />

                      <Controller
                        name="altNumber"
                        control={control}
                        render={({ field }) => (
                          <CustomField label="Alternative (Optional)" htmlFor="altNumber" error={errors.altNumber}>
                            <PhoneInput
                              {...field}
                              id="altNumber"
                              autoComplete="off"
                              error={!!errors.altNumber}
                            />
                          </CustomField>
                        )}
                      />
                    </div>

                    <Controller
                      name="assistanceType"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col mt-4 w-full">
                          <Label.Root className="text-[14px] font-medium text-gray-900 mb-3">
                            How would you like to proceed? <span aria-hidden="true" className="text-gray-400 ml-[2px]">*</span>
                          </Label.Root>
                          
                          <RadioGroup.Root 
                            className="flex flex-col gap-3 w-full"
                            value={field.value || 'discuss_team'}
                            onValueChange={field.onChange}
                            aria-label="Assistance Type"
                          >
                            <label 
                              className={cn(
                                "flex items-start p-4 rounded-xl border cursor-pointer transition-all",
                                (field.value || 'discuss_team') === 'discuss_team'
                                  ? "border-[#b512b8] bg-[#b512b8]/5 shadow-[0_0_0_1px_#b512b8]"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                            >
                              <RadioGroup.Item 
                                value="discuss_team" 
                                id="radio-discuss-team"
                                className="w-5 h-5 rounded-full border-2 border-[#b512b8] bg-white flex items-center justify-center mt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2 transition-all shrink-0"
                              >
                                <RadioGroup.Indicator className="flex items-center justify-center w-full h-full">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#b512b8]" />
                                </RadioGroup.Indicator>
                              </RadioGroup.Item>
                              <div className="ml-3.5">
                                <p className={cn(
                                  "text-[15px] font-medium",
                                  (field.value || 'discuss_team') === 'discuss_team' ? "text-[#8c0c8e]" : "text-gray-900"
                                )}>
                                  Request a callback (default)
                                </p>
                                <p className="text-[14px] text-gray-500 mt-0.5">
                                  We shall call you back to discuss project requirements
                                </p>
                              </div>
                            </label>

                            <label 
                              className={cn(
                                "flex items-start p-4 rounded-xl border cursor-pointer transition-all",
                                field.value === 'complete_brief'
                                  ? "border-[#b512b8] bg-[#b512b8]/5 shadow-[0_0_0_1px_#b512b8]"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                            >
                              <RadioGroup.Item 
                                value="complete_brief" 
                                id="radio-complete-brief"
                                className="w-5 h-5 rounded-full border-2 border-[#b512b8] bg-white flex items-center justify-center mt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2 transition-all shrink-0"
                              >
                                <RadioGroup.Indicator className="flex items-center justify-center w-full h-full">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#b512b8]" />
                                </RadioGroup.Indicator>
                              </RadioGroup.Item>
                              <div className="ml-3.5">
                                <p className={cn(
                                  "text-[15px] font-medium",
                                  field.value === 'complete_brief' ? "text-[#8c0c8e]" : "text-gray-900"
                                )}>
                                  Complete the project brief yourself
                                </p>
                                <p className="text-[14px] text-gray-500 mt-0.5">
                                  Best if you already know your requirements. Takes about 5 minutes.
                                </p>
                              </div>
                            </label>
                          </RadioGroup.Root>

                          {errors.assistanceType && (
                            <p role="alert" className="text-[13px] text-red-600 mt-2">
                              {errors.assistanceType.message}
                            </p>
                          )}
                        </div>
                      )}
                    />

                    <div className="pt-4">
                      {assistanceType === 'complete_brief' ? (
                        <button 
                          type="button" 
                          onClick={handleNext}
                          className="w-full h-14 bg-[#b512b8] hover:bg-[#8c0c8e] text-white font-medium text-[16px] rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2"
                        >
                          Continue
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full h-14 bg-[#b512b8] hover:bg-[#8c0c8e] text-white font-medium text-[16px] rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2 flex items-center justify-center"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            <span>Submit enquiry</span>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && assistanceType === 'complete_brief' && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 mb-12"
                  >
                    <Controller
                      name="businessName"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Company name" required htmlFor="businessName" error={errors.businessName}>
                          <input 
                            {...field}
                            id="businessName"
                            type="text"
                            autoComplete="organization"
                            placeholder="Acme Corp"
                            aria-invalid={!!errors.businessName}
                            className={cn(inputStyles, errors.businessName && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="serviceOffered"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Product or service" required htmlFor="serviceOffered" error={errors.serviceOffered}>
                          <input 
                            {...field}
                            id="serviceOffered"
                            type="text"
                            placeholder="Real estate consulting"
                            aria-invalid={!!errors.serviceOffered}
                            className={cn(inputStyles, errors.serviceOffered && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="reqSummary"
                      control={control}
                      render={({ field }) => (
                        <CustomField 
                          label="Project summary" 
                          required 
                          htmlFor="reqSummary" 
                          error={errors.reqSummary} 
                          helperText="Short 1-line summary about what you need."
                          maxLength={120}
                          currentLength={(watch('reqSummary') || '').length}
                        >
                          <textarea 
                            {...field}
                            id="reqSummary"
                            rows={3}
                            maxLength={120}
                            placeholder="e.g., Build an e-commerce website for clothing"
                            aria-invalid={!!errors.reqSummary}
                            className={cn(textareaStyles, errors.reqSummary && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="expectedOutcome"
                      control={control}
                      render={({ field }) => (
                        <CustomField 
                          label="Expected outcome" 
                          required 
                          htmlFor="expectedOutcome" 
                          error={errors.expectedOutcome} 
                          helperText="Short 1-line summary about outcome or result expected."
                          maxLength={120}
                          currentLength={(watch('expectedOutcome') || '').length}
                        >
                          <textarea 
                            {...field}
                            id="expectedOutcome"
                            rows={3}
                            maxLength={120}
                            placeholder="e.g., Launch in 30 days & drive online sales"
                            aria-invalid={!!errors.expectedOutcome}
                            className={cn(textareaStyles, errors.expectedOutcome && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex items-center justify-center w-full h-14 border border-gray-300 text-gray-700 font-medium text-[16px] rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 sm:w-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="relative flex items-center justify-center w-full h-14 bg-[#b512b8] hover:bg-[#8c0c8e] text-white font-medium text-[16px] rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm sm:w-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          <span>Submit project</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-6 pt-10 border-t border-gray-200">
              <h3 className="text-[12px] uppercase tracking-wide font-semibold text-gray-500 mb-5">
                Privacy & Commitment
              </h3>
              <ul className="space-y-3.5 m-0 p-0 list-none">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <p className="text-[14px] text-gray-600">We'll review every enquiry personally.</p>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <p className="text-[14px] text-gray-600">Replies usually within one business day.</p>
                </li>
                <li className="flex items-center gap-3">
                  <Lock className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                  <p className="text-[14px] text-gray-600">No spam. No obligation.</p>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

