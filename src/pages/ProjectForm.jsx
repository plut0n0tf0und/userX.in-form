import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Stack, Button, 
  Card, CardActionArea, Radio, Alert, Collapse, CircularProgress,
  InputLabel, OutlinedInput, FormHelperText, FormControl
} from '@mui/material';
import { CheckCircleOutlined, LockOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { matchIsValidTel, MuiTelInput } from 'mui-tel-input';

const steps = ['Contact Information', 'Business & Requirements'];

const schema = yup.object().shape({
  name: yup.string().required('Full Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  whatsappNumber: yup.string().test('is-valid-phone', 'Please enter a valid phone number', (value) => matchIsValidTel(value || '')).required('WhatsApp number is required'),
  altNumber: yup.string().test('is-valid-alt-phone', 'Please enter a valid phone number', (value) => !value || matchIsValidTel(value)),
  
  businessName: yup.string().required('Name of Business is required'),
  serviceOffered: yup.string().required('Service or Product You Offer is required'),
  reqSummary: yup.string().required('Requirement summary is required'),
  expectedOutcome: yup.string().required('Expected outcome is required'),
  assistanceType: yup.string().required('Please select how you would like to proceed'),
});

const scriptURL = "https://script.google.com/macros/s/AKfycbxLRftndaH_znmmYtWfL9mmP9hoWXiPaBb8sOGBO5DPXZncXF4hX5akHaMgj8CEcMwW/exec";

// Custom Input Field Wrapper to enforce label above and helper text below
const CustomField = ({ label, required, error, helperText, children, htmlFor }) => (
  <FormControl error={!!error} fullWidth variant="outlined">
    <InputLabel htmlFor={htmlFor} shrink sx={{ transform: 'none', position: 'relative', mb: '6px', fontWeight: 500, color: 'text.primary', fontSize: '14px' }}>
      {label} {required && <span aria-hidden="true" style={{ color: '#94A3B8', marginLeft: '2px' }}>*</span>}
    </InputLabel>
    {children}
    {(helperText || error) && (
      <FormHelperText role={error ? "alert" : undefined} sx={{ mx: 0, mt: '6px', fontSize: '13px', color: error ? 'error.main' : 'text.secondary', lineHeight: 1.4 }}>
        {error ? error.message : helperText}
      </FormHelperText>
    )}
  </FormControl>
);

export default function ProjectForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors }, trigger, setValue } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
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
    const params = new URLSearchParams(window.location.search);
    const urlLeadId = params.get('lead_id');
    const urlPhone = params.get('phone');
    
    if (urlLeadId) {
      setLeadId(urlLeadId);
    } else {
      setLeadId('L-' + Math.random().toString(36).substr(2, 6).toUpperCase());
    }

    if (urlPhone) {
      // Decode and strip any extraneous characters if needed, but MuiTelInput handles + mostly well
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
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        const businessPhone = "919962852828";
        const message = encodeURIComponent("I have submitted the form");
        window.location.href = `whatsapp://send?phone=${businessPhone}&text=${message}`;
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Failed to submit form. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '680px', py: { xs: 6, md: 10 } }}>
        <Box 
          role="status" 
          tabIndex={-1} 
          ref={(el) => { if (el) el.focus(); }}
          textAlign="center" p={{ xs: 4, md: 6 }} borderRadius={3} bgcolor="#FFFFFF" border="1px solid #E2E8F0" boxShadow="0 4px 24px rgba(0,0,0,0.02)"
          sx={{ outline: 'none' }}
        >
          <CheckCircleOutlined sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
          <Typography variant="h2" gutterBottom color="text.primary" sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
            Submission Successful
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4} sx={{ fontSize: '1rem', maxWidth: '400px', mx: 'auto' }}>
            We've received your requirements and will review them shortly. A confirmation email has been sent to you.
          </Typography>
          <Box display="inline-flex" alignItems="center" gap={1.5} px={2.5} py={1} bgcolor="primary.light" color="primary.main" borderRadius={2} fontWeight={500} sx={{ background: 'rgba(181, 18, 184, 0.08)', fontSize: '14px' }}>
            <CircularProgress size={16} color="inherit" />
            Redirecting to WhatsApp...
          </Box>
        </Box>
      </Container>
    );
  }

  const CustomStepper = () => (
    <Box mb={4}>
      <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.5} sx={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Step {activeStep + 1} of {steps.length}
      </Typography>
      <Typography variant="h2" component="h2" color="text.primary" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
        {steps[activeStep]}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {steps.map((_, index) => (
          <Box 
            key={index}
            sx={{
              height: '4px',
              flex: 1,
              bgcolor: index <= activeStep ? 'primary.main' : 'divider',
              borderRadius: '2px',
              transition: 'background-color 300ms ease-in-out'
            }}
          />
        ))}
      </Stack>
    </Box>
  );

  return (
    <Container maxWidth={false} sx={{ maxWidth: '680px', py: { xs: 4, md: 8 } }}>
      <Box mb={4}>
        <Typography component="h1" variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5, letterSpacing: '-0.02em' }}>
          Project Enquiry
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem', lineHeight: 1.5 }}>
          Please provide some details about your project. It takes about 3 minutes.
        </Typography>
      </Box>

      <CustomStepper />

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* STEP 1: Contact Information */}
        <Collapse in={activeStep === 0} mountOnEnter unmountOnExit>
          <Stack spacing={3} mb={5}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <CustomField label="Full Name" required htmlFor="name" error={errors.name}>
                  <OutlinedInput {...field} id="name" autoComplete="name" placeholder="e.g. Jane Doe" notched={false} aria-required="true" aria-invalid={!!errors.name} />
                </CustomField>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CustomField label="Email Address" required htmlFor="email" error={errors.email}>
                  <OutlinedInput {...field} id="email" type="email" autoComplete="email" placeholder="jane@example.com" notched={false} aria-required="true" aria-invalid={!!errors.email} />
                </CustomField>
              )}
            />

            <Controller
              name="whatsappNumber"
              control={control}
              render={({ field: { ref, ...field } }) => (
                <CustomField label="WhatsApp Number" required htmlFor="whatsappNumber" error={errors.whatsappNumber}>
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
                <CustomField label="Alternate Contact Number" htmlFor="altNumber" error={errors.altNumber} helperText="(Optional)">
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

            <Box pt={1}>
              <Button variant="contained" size="large" fullWidth onClick={handleNext} sx={{ minHeight: '52px' }}>
                Continue to Requirements
              </Button>
            </Box>
          </Stack>
        </Collapse>

        {/* STEP 2: Business & Requirements */}
        <Collapse in={activeStep === 1} mountOnEnter unmountOnExit>
          <Stack spacing={3} mb={5}>
            <Controller
              name="businessName"
              control={control}
              render={({ field }) => (
                <CustomField label="Business Name" required htmlFor="businessName" error={errors.businessName}>
                  <OutlinedInput {...field} id="businessName" autoComplete="organization" placeholder="e.g. Acme Corp" notched={false} aria-required="true" aria-invalid={!!errors.businessName} />
                </CustomField>
              )}
            />

            <Controller
              name="serviceOffered"
              control={control}
              render={({ field }) => (
                <CustomField label="Service or Product" required htmlFor="serviceOffered" error={errors.serviceOffered}>
                  <OutlinedInput {...field} id="serviceOffered" placeholder="e.g. Real Estate Consulting" notched={false} aria-required="true" aria-invalid={!!errors.serviceOffered} />
                </CustomField>
              )}
            />

            <Controller
              name="reqSummary"
              control={control}
              render={({ field }) => (
                <CustomField label="Requirement Summary" required htmlFor="reqSummary" error={errors.reqSummary} helperText="In one sentence, what do you need?">
                  <OutlinedInput {...field} id="reqSummary" placeholder="e.g. A new e-commerce website" notched={false} aria-required="true" aria-invalid={!!errors.reqSummary} />
                </CustomField>
              )}
            />

            <Controller
              name="expectedOutcome"
              control={control}
              render={({ field }) => (
                <CustomField label="Expected Outcome" required htmlFor="expectedOutcome" error={errors.expectedOutcome} helperText="What is the primary goal?">
                  <OutlinedInput {...field} id="expectedOutcome" placeholder="e.g. Increase online sales by 20%" notched={false} aria-required="true" aria-invalid={!!errors.expectedOutcome} />
                </CustomField>
              )}
            />

            <Controller
              name="assistanceType"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.assistanceType} fullWidth sx={{ mt: 1 }}>
                  <InputLabel shrink sx={{ transform: 'none', position: 'relative', mb: '10px', fontWeight: 500, color: 'text.primary', fontSize: '14px' }}>
                    How would you like to proceed? <span aria-hidden="true" style={{ color: '#94A3B8', marginLeft: '2px' }}>*</span>
                  </InputLabel>
                  <Stack spacing={1.5}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        borderColor: field.value === 'fill_details' ? 'primary.main' : 'divider',
                        boxShadow: field.value === 'fill_details' ? '0 0 0 1px #B512B8' : 'none',
                        bgcolor: field.value === 'fill_details' ? 'rgba(181, 18, 184, 0.03)' : '#FFFFFF',
                        borderRadius: 2
                      }}
                    >
                      <CardActionArea onClick={() => field.onChange('fill_details')} sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                          <Radio checked={field.value === 'fill_details'} sx={{ p: 0, mt: 0.25 }} size="small" />
                          <Box>
                            <Typography variant="body1" fontWeight={field.value === 'fill_details' ? 600 : 500} color={field.value === 'fill_details' ? 'primary.dark' : 'text.primary'} sx={{ fontSize: '15px' }}>
                              Fill requirement details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.25}>
                              Takes about 5 minutes
                            </Typography>
                          </Box>
                        </Stack>
                      </CardActionArea>
                    </Card>

                    <Card 
                      variant="outlined"
                      sx={{ 
                        borderColor: field.value === 'call_back' ? 'primary.main' : 'divider',
                        boxShadow: field.value === 'call_back' ? '0 0 0 1px #B512B8' : 'none',
                        bgcolor: field.value === 'call_back' ? 'rgba(181, 18, 184, 0.03)' : '#FFFFFF',
                        borderRadius: 2
                      }}
                    >
                      <CardActionArea onClick={() => field.onChange('call_back')} sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                          <Radio checked={field.value === 'call_back'} sx={{ p: 0, mt: 0.25 }} size="small" />
                          <Box>
                            <Typography variant="body1" fontWeight={field.value === 'call_back' ? 600 : 500} color={field.value === 'call_back' ? 'primary.dark' : 'text.primary'} sx={{ fontSize: '15px' }}>
                              Need help, call me back
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.25}>
                              We'll call your given phone number
                            </Typography>
                          </Box>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  </Stack>
                  {errors.assistanceType && <FormHelperText role="alert" sx={{ mx: 0, mt: '8px', color: 'error.main' }}>{errors.assistanceType.message}</FormHelperText>}
                </FormControl>
              )}
            />

            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} pt={2}>
              <Button variant="outlined" size="large" onClick={handleBack} fullWidth disabled={isSubmitting} sx={{ minHeight: '52px' }}>
                Back
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                fullWidth 
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ minHeight: '52px' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </form>

      {/* Trust section moved to bottom & made compact */}
      <Box mt={2} pt={4} borderTop="1px solid" borderColor="divider">
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px' }}>
          Our Commitment
        </Typography>
        <Stack spacing={1.5} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          <Box component="li" display="flex" alignItems="center" gap={1.5}>
            <CheckCircleOutlined sx={{ color: 'text.secondary', fontSize: '16px' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>We'll review every enquiry personally.</Typography>
          </Box>
          <Box component="li" display="flex" alignItems="center" gap={1.5}>
            <CheckCircleOutlined sx={{ color: 'text.secondary', fontSize: '16px' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>Usually reply within one business day.</Typography>
          </Box>
          <Box component="li" display="flex" alignItems="center" gap={1.5}>
            <LockOutlined sx={{ color: 'text.secondary', fontSize: '16px' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>No spam. No obligation.</Typography>
          </Box>
        </Stack>
      </Box>

    </Container>
  );
}
