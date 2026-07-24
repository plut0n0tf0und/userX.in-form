import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Stack, Button, 
  Alert, CircularProgress, Divider, Link,
  InputLabel, OutlinedInput, FormHelperText, FormControl
} from '@mui/material';
import { CheckCircleOutlined, InfoOutlined, ShieldOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { matchIsValidTel, MuiTelInput } from 'mui-tel-input';

const schema = yup.object().shape({
  whatsappNumber: yup.string().test('is-valid-phone', 'Please enter a valid phone number', (value) => matchIsValidTel(value || '')).required('Primary phone is required'),
  altNumber: yup.string().test('is-valid-alt-phone', 'Please enter a valid phone number', (value) => !value || matchIsValidTel(value)),
  email: yup.string().email('Invalid email address').required('Email is required'),
  name: yup.string().required('Your Name is required'),
  problem: yup.string().required('Please tell us how we can help'),
});

const scriptURL = "https://script.google.com/macros/s/AKfycbxLRftndaH_znmmYtWfL9mmP9hoWXiPaBb8sOGBO5DPXZncXF4hX5akHaMgj8CEcMwW/exec";

// Custom Input Field Wrapper to enforce label above and helper text below
const CustomField = ({ label, required, error, helperText, children, htmlFor }) => (
  <FormControl error={!!error} fullWidth variant="outlined">
    <InputLabel htmlFor={htmlFor} shrink sx={{ transform: 'none', position: 'relative', mb: '6px', fontWeight: 500, color: 'text.primary', fontSize: '14px' }}>
      {label} {required && <span aria-hidden="true" style={{ color: '#94A3B8' }}>*</span>}
    </InputLabel>
    {children}
    {(helperText || error) && (
      <FormHelperText role={error ? "alert" : undefined} sx={{ mx: 0, mt: '6px', fontSize: '14px', color: error ? 'error.main' : 'text.secondary' }}>
        {error ? error.message : helperText}
      </FormHelperText>
    )}
  </FormControl>
);

export default function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      whatsappNumber: '',
      altNumber: '',
      email: '',
      name: '',
      problem: '',
    }
  });

  const [leadId, setLeadId] = useState('');

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
      phone: data.whatsappNumber // Map whatsappNumber to phone for backend if needed
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
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        const businessPhone = "919962852828";
        const message = encodeURIComponent("I have submitted a support ticket");
        window.location.href = `whatsapp://send?phone=${businessPhone}&text=${message}`;
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Failed to submit ticket. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '680px', py: { xs: 6, md: 10 } }}>
        <Box 
          role="status" 
          tabIndex={-1} 
          ref={(el) => { if (el) el.focus(); }}
          textAlign="center" p={{ xs: 4, md: 6 }} borderRadius={4} bgcolor="#FFFFFF" border="1px solid #E2E8F0" boxShadow="0 4px 24px rgba(0,0,0,0.02)"
          sx={{ outline: 'none' }}
        >
          <CheckCircleOutlined sx={{ fontSize: 64, color: 'success.main', mb: 3 }} />
          <Typography variant="h2" gutterBottom color="text.primary" sx={{ fontSize: { xs: '1.75rem', md: '2rem' } }}>
            Thanks for reaching out.
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2} sx={{ fontSize: '1rem', maxWidth: '400px', mx: 'auto' }}>
            We've received your enquiry and our team usually replies within one business day.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={5}>
            If your enquiry is urgent, you can also contact us on WhatsApp or email{' '}
            <Link href="mailto:support@userxpert.in" fontWeight={500} color="primary.main" underline="hover">
              support@userxpert.in
            </Link>.
          </Typography>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
            <Button variant="outlined" component="a" href="https://userx-site.vercel.app/" sx={{ minHeight: '48px', minWidth: '160px' }}>
              Return Home
            </Button>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ minHeight: '48px', minWidth: '160px' }}>
              Send Another Enquiry
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: '680px', py: { xs: 4, md: 8 } }}>
      <Box mb={5} textAlign="center">
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 2 }}>
          How Can We Help?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
          Tell us about the issue or question you have. We usually respond within one business day.
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={4}>
          <Box p={{ xs: 3, md: 4 }} borderRadius={4} bgcolor="#FFFFFF" border="1px solid #E2E8F0">
            <Stack spacing={3}>
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field: { ref, ...field } }) => (
                  <CustomField label="Primary Phone Number" required htmlFor="whatsappNumber" error={errors.whatsappNumber} helperText="We'll use this to contact you.">
                    <MuiTelInput 
                      {...field}
                      id="whatsappNumber"
                      autoComplete="tel"
                      defaultCountry="IN"
                      forceCallingCode
                      focusOnSelectCountry
                      variant="outlined"
                      InputProps={{ notched: false }}
                      inputRef={ref}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                        '& .MuiIconButton-root': { width: '44px', height: '44px', ml: 1 }
                      }}
                    />
                  </CustomField>
                )}
              />

              <Controller
                name="altNumber"
                control={control}
                render={({ field: { ref, ...field } }) => (
                  <CustomField label="Backup Phone Number" htmlFor="altNumber" error={errors.altNumber} helperText="(Optional) Only if you'd like us to try another number.">
                    <MuiTelInput 
                      {...field}
                      id="altNumber"
                      autoComplete="tel"
                      defaultCountry="IN"
                      forceCallingCode
                      focusOnSelectCountry
                      variant="outlined"
                      InputProps={{ notched: false }}
                      inputRef={ref}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                        '& .MuiIconButton-root': { width: '44px', height: '44px', ml: 1 }
                      }}
                    />
                  </CustomField>
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <CustomField label="Email Address" required htmlFor="email" error={errors.email} helperText="We'll send updates about your ticket here.">
                    <OutlinedInput {...field} id="email" type="email" autoComplete="email" placeholder="name@example.com" notched={false} aria-required="true" aria-invalid={!!errors.email} />
                  </CustomField>
                )}
              />

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomField label="Your Name" required htmlFor="name" error={errors.name}>
                    <OutlinedInput {...field} id="name" autoComplete="name" placeholder="First and Last Name" notched={false} aria-required="true" aria-invalid={!!errors.name} />
                  </CustomField>
                )}
              />

              <Controller
                name="problem"
                control={control}
                render={({ field }) => (
                  <CustomField label="How can we help?" required htmlFor="problem" error={errors.problem}>
                    <OutlinedInput 
                      {...field} 
                      id="problem" 
                      placeholder='Please describe the issue or problem you&apos;re facing.&#10;&#10;Example: "The new leads from my website aren&apos;t showing up in our Google Sheet."'
                      multiline 
                      minRows={4} 
                      notched={false} 
                      aria-required="true" 
                      aria-invalid={!!errors.problem}
                      sx={{ '& textarea': { resize: 'vertical', minHeight: '100px' } }}
                    />
                  </CustomField>
                )}
              />
            </Stack>
          </Box>

          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            fullWidth 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ minHeight: '52px' }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </Stack>
      </form>
      
      <Divider sx={{ my: 4 }} />
      
      <Stack spacing={2} mb={4} color="text.secondary">
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          <InfoOutlined sx={{ color: 'text.secondary', fontSize: '20px', mt: '2px' }} />
          <Typography variant="body2" sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>Most enquiries receive a reply within one business day.</Typography>
        </Box>
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          <ShieldOutlined sx={{ color: 'text.secondary', fontSize: '20px', mt: '2px' }} />
          <Typography variant="body2" sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>Your information is only used to respond to your enquiry.</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontSize: '0.9375rem' }}>
        Need a faster response? WhatsApp us or email{' '}
        <Link href="mailto:support@userxpert.in" fontWeight={500} color="primary.main" underline="hover">
          support@userxpert.in
        </Link>.
      </Typography>
    </Container>
  );
}
