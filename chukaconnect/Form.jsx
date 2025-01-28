import React, { useCallback } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { api } from './api';

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(6, 'Too short').required('Required')
});

const LoginForm = () => {
    const handleSubmit = useCallback(async (values, { setSubmitting, setStatus }) => {
        try {
            const response = await api.login({
                email: values.email.trim(),
                password: values.password
            });

            if (response?.token) {
                sessionStorage.setItem('token', response.token);
                window.location.href = '/dashboard';
            }
        } catch (err) {
            setStatus(err.message);
        } finally {
            setSubmitting(false);
        }
    }, []);

    return (
        <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ errors, touched, isSubmitting, status }) => (
                <Form className="login-form">
                    {status && <div className="error-message">{status}</div>}

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        disabled={isSubmitting}
                        className={errors.email && touched.email ? 'error' : ''}
                    />
                    {errors.email && touched.email && (
                        <div className="field-error">{errors.email}</div>
                    )}

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        disabled={isSubmitting}
                        className={errors.password && touched.password ? 'error' : ''}
                    />
                    {errors.password && touched.password && (
                        <div className="field-error">{errors.password}</div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={isSubmitting ? 'loading' : ''}
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </Form>
            )}
        </Formik>
    );
};

export default LoginForm; 