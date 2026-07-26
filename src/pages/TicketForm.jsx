import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, Shield, Loader2 } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PhoneInput } from '../components/PhoneInput';

import { isValidPhoneNumber } from 'libphonenumber-js';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const schema = yup.object().shape({
  whatsappNumber: yup.string().test('is-valid-phone', 'Enter a valid phone number.', (value) => value ? isValidPhoneNumber(value) : false).required('Phone number is required.'),
  altNumber: yup.string().test('is-valid-alt-phone', 'Enter a valid phone number.', (value) => !value || isValidPhoneNumber(value)),
  email: yup.string().required('Business email is required.').matches(emailRegex, 'Enter a valid email address (e.g. name@company.com).'),
  name: yup.string().required('Enter your full name.'),
  problem: yup.string().required('Describe your issue.'),
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

export default function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: JSON.parse(localStorage.getItem('TicketForm_draft')) || {
      whatsappNumber: '',
      altNumber: '',
      email: '',
      name: '',
      problem: '',
    }
  });

  const [leadId, setLeadId] = useState('');

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('TicketForm_draft', JSON.stringify(value));
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
      setLeadId('T-' + Math.random().toString(36).substr(2, 6).toUpperCase());
    }

    if (urlPhone) {
      let cleanPhone = decodeURIComponent(urlPhone).trim();
      if (!cleanPhone.startsWith('+') && /^\d/.test(cleanPhone)) {
         cleanPhone = '+' + cleanPhone; 
      }
      setValue('whatsappNumber', cleanPhone, { shouldValidate: true });
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    const payload = {
      action: "submit_ticket",
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
      localStorage.removeItem('TicketForm_draft');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        const businessPhone = "919962852828";
        const message = encodeURIComponent("I have submitted a support ticket");
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
              Thanks! We've received your enquiry.
            </h2>
            <p className="text-base text-gray-600 mb-8 max-w-[400px]">
              We'll review it and contact you within one business day.
            </p>
            <p className="text-[14px] text-gray-500 mb-10">
              If your enquiry is urgent, you can also contact us on WhatsApp or email{' '}
              <a href="mailto:support.userx.in@gmail.com" className="font-medium text-[#b512b8] hover:underline">
                support.userx.in@gmail.com
              </a>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
              <a 
                href="https://userx-site.vercel.app/" 
                className="flex items-center justify-center h-12 px-6 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Return home
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="flex items-center justify-center h-12 px-6 rounded-xl bg-[#b512b8] text-white font-medium hover:bg-[#8c0c8e] transition-colors w-full sm:w-auto"
              >
                Send another enquiry
              </button>
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
              <h1 className="text-3xl md:text-[40px] font-semibold text-gray-900 mb-4 tracking-tight">
                Support request
              </h1>
              <p className="text-[17px] text-gray-500 max-w-[500px]">
                Tell us about your issue or question. We usually respond within one business day.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
              <div className="p-6 md:p-8 bg-white rounded-3xl border border-gray-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] space-y-6">
                
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
                    <CustomField label="Business email" required htmlFor="email" error={errors.email} helperText="We'll send updates here.">
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
                      <CustomField label="Phone number" required htmlFor="whatsappNumber" error={errors.whatsappNumber} helperText="We'll use this to contact you.">
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
                      <CustomField label="Alternative (Optional)" htmlFor="altNumber" error={errors.altNumber} helperText="Try another number.">
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
                  name="problem"
                  control={control}
                  render={({ field }) => (
                    <CustomField label="Issue description" required htmlFor="problem" error={errors.problem}>
                      <textarea 
                        {...field}
                        id="problem"
                        rows={4}
                        placeholder="Describe your goals, current challenges, or anything you'd like us to know."
                        aria-invalid={!!errors.problem}
                        className={cn(
                          inputStyles, 
                          "py-3 resize-y min-h-[100px]", 
                          errors.problem && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                    </CustomField>
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative flex items-center justify-center w-full h-14 bg-[#b512b8] hover:bg-[#8c0c8e] text-white font-medium text-[16px] rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending enquiry...
                  </span>
                ) : (
                  <span>Send enquiry</span>
                )}
              </button>
            </form>

            <div className="my-10 border-t border-gray-200"></div>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3 text-gray-500">
                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-[14px] leading-relaxed">Most enquiries receive a reply within one business day.</p>
              </div>
              <div className="flex items-start gap-3 text-gray-500">
                <Shield className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-[14px] leading-relaxed">Used only for your enquiry. We never share your information.</p>
              </div>
            </div>

            <div className="my-10 border-t border-gray-200"></div>

            <p className="text-center text-[14px] text-gray-500">
              Need a faster response? WhatsApp us or email{' '}
              <a href="mailto:support.userx.in@gmail.com" className="font-medium text-[#b512b8] hover:underline">
                support.userx.in@gmail.com
              </a>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
