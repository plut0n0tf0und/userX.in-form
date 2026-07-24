import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, Loader2 } from 'lucide-react';
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

const schema = yup.object().shape({
  name: yup.string().required('Enter your full name.'),
  email: yup.string().email('Enter a valid email address.').required('Enter your business email.'),
  whatsappNumber: yup.string().test('is-valid-phone', 'Enter a valid phone number.', (value) => value ? isValidPhoneNumber(value) : false).required('Phone number is required.'),
  altNumber: yup.string().test('is-valid-alt-phone', 'Enter a valid phone number.', (value) => !value || isValidPhoneNumber(value)),
  
  businessName: yup.string().required('Enter your company name.'),
  serviceOffered: yup.string().required('Enter your product or service.'),
  reqSummary: yup.string().required('Enter a project summary.'),
  expectedOutcome: yup.string().required('Enter expected outcome.'),
  assistanceType: yup.string().required('Select how to proceed.'),
});

const scriptURL = "https://script.google.com/macros/s/AKfycbxLRftndaH_znmmYtWfL9mmP9hoWXiPaBb8sOGBO5DPXZncXF4hX5akHaMgj8CEcMwW/exec";

const CustomField = ({ label, required, error, helperText, children, htmlFor }) => (
  <div className="flex flex-col space-y-2 w-full">
    <Label.Root htmlFor={htmlFor} className="text-[14px] font-medium text-gray-900">
      {label} {required && <span aria-hidden="true" className="text-gray-400 ml-[2px]">*</span>}
    </Label.Root>
    {children}
    {(helperText || error) && (
      <p 
        role={error ? "alert" : undefined} 
        className={cn("text-[13px] leading-[1.4]", error ? "text-red-600" : "text-gray-500")}
      >
        {error ? error.message : helperText}
      </p>
    )}
  </div>
);

const inputStyles = "flex h-12 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-[15px] text-gray-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] disabled:cursor-not-allowed disabled:opacity-50";

export default function ProjectForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors }, trigger, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: JSON.parse(localStorage.getItem('ProjectForm_draft')) || {
      name: '',
      email: '',
      whatsappNumber: '',
      altNumber: '',
      businessName: '',
      serviceOffered: '',
      reqSummary: '',
      expectedOutcome: '',
      assistanceType: 'fill_details'
    }
  });

  const [leadId, setLeadId] = useState('');

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('ProjectForm_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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
      let cleanPhone = decodeURIComponent(urlPhone).trim();
      if (!cleanPhone.startsWith('+') && /^\d/.test(cleanPhone)) {
         cleanPhone = '+' + cleanPhone; 
      }
      setValue('whatsappNumber', cleanPhone, { shouldValidate: true });
    }
  }, [setValue]);

  const handleNext = async () => {
    const fieldsToValidate = activeStep === 0 
      ? ['name', 'email', 'whatsappNumber', 'altNumber']
      : [];
    
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setActiveStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const firstErrorField = fieldsToValidate.find(f => errors[f]);
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField);
          if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
      }
    } else {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const message = encodeURIComponent("I have submitted the form");
        window.location.href = `whatsapp://send?phone=${businessPhone}&text=${message}`;
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
                Project enquiry
              </h1>
              <p className="text-[17px] text-gray-500 leading-relaxed">
                Provide some details about your project. It takes about 3 minutes.
              </p>
            </div>

            <div className="mb-10">
              <p className="text-[13px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
                Step {activeStep + 1} of {steps.length}
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {steps[activeStep]}
              </h2>
              <div className="flex gap-2 items-center">
                {steps.map((_, index) => (
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

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

                    <Controller
                      name="whatsappNumber"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Phone number" required htmlFor="whatsappNumber" error={errors.whatsappNumber}>
                          <PhoneInput
                            {...field}
                            id="whatsappNumber"
                            placeholder="+91 99999 99999"
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
                            placeholder="+91 99999 99999"
                            error={!!errors.altNumber}
                          />
                        </CustomField>
                      )}
                    />

                    <div className="pt-4">
                      <button 
                        type="button" 
                        onClick={handleNext}
                        className="w-full h-14 bg-[#b512b8] hover:bg-[#8c0c8e] text-white font-medium text-[16px] rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && (
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
                        <CustomField label="Project summary" required htmlFor="reqSummary" error={errors.reqSummary} helperText="Briefly describe what you need.">
                          <input 
                            {...field}
                            id="reqSummary"
                            type="text"
                            placeholder="A new e-commerce website"
                            aria-invalid={!!errors.reqSummary}
                            className={cn(inputStyles, errors.reqSummary && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="expectedOutcome"
                      control={control}
                      render={({ field }) => (
                        <CustomField label="Expected outcome" required htmlFor="expectedOutcome" error={errors.expectedOutcome} helperText="What is the primary goal?">
                          <input 
                            {...field}
                            id="expectedOutcome"
                            type="text"
                            placeholder="Increase online sales by 20%"
                            aria-invalid={!!errors.expectedOutcome}
                            className={cn(inputStyles, errors.expectedOutcome && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </CustomField>
                      )}
                    />

                    <Controller
                      name="assistanceType"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col mt-2 w-full">
                          <Label.Root className="text-[14px] font-medium text-gray-900 mb-3">
                            How would you like to proceed? <span aria-hidden="true" className="text-gray-400 ml-[2px]">*</span>
                          </Label.Root>
                          
                          <RadioGroup.Root 
                            className="flex flex-col gap-3 w-full"
                            value={field.value}
                            onValueChange={field.onChange}
                            aria-label="Assistance Type"
                          >
                            <label 
                              className={cn(
                                "flex items-start p-4 rounded-xl border cursor-pointer transition-all",
                                field.value === 'fill_details' 
                                  ? "border-[#b512b8] bg-[#b512b8]/5 shadow-[0_0_0_1px_#b512b8]" 
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              )}
                            >
                              <RadioGroup.Item 
                                value="fill_details" 
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2",
                                  field.value === 'fill_details' ? "border-[#b512b8] bg-[#b512b8]" : "border-gray-300"
                                )}
                              >
                                <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
                              </RadioGroup.Item>
                              <div className="ml-3.5">
                                <p className={cn("text-[15px] font-medium", field.value === 'fill_details' ? "text-[#8c0c8e]" : "text-gray-900")}>
                                  Fill requirement details
                                </p>
                                <p className="text-[14px] text-gray-500 mt-0.5">
                                  Takes about 5 minutes
                                </p>
                              </div>
                            </label>

                            <label 
                              className={cn(
                                "flex items-start p-4 rounded-xl border cursor-pointer transition-all",
                                field.value === 'call_back' 
                                  ? "border-[#b512b8] bg-[#b512b8]/5 shadow-[0_0_0_1px_#b512b8]" 
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              )}
                            >
                              <RadioGroup.Item 
                                value="call_back" 
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#b512b8] focus-visible:ring-offset-2",
                                  field.value === 'call_back' ? "border-[#b512b8] bg-[#b512b8]" : "border-gray-300"
                                )}
                              >
                                <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
                              </RadioGroup.Item>
                              <div className="ml-3.5">
                                <p className={cn("text-[15px] font-medium", field.value === 'call_back' ? "text-[#8c0c8e]" : "text-gray-900")}>
                                  Need help, call me back
                                </p>
                                <p className="text-[14px] text-gray-500 mt-0.5">
                                  We'll call the number provided.
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
