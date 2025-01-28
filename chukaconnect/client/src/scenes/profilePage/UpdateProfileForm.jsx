import { Box, Button, TextField, useTheme, Typography, CircularProgress } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";
import Dropzone from "react-dropzone";
import FlexBetween from "components/FlexBetween";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { apiRequest, uploadRequest } from "utils/api";
import { useState, useEffect } from "react";

const updateSchema = yup.object().shape({
  firstName: yup.string().nullable(),
  lastName: yup.string().nullable(),
  email: yup.string().email("Invalid email format").nullable(),
  currentPassword: yup.string().when('newPassword', {
    is: (val) => val && val.length > 0,
    then: () => yup.string().required('Current password is required to change password'),
    otherwise: () => yup.string().nullable()
  }),
  newPassword: yup.string()
    .nullable()
    .test('password-strength', 'Password must be at least 8 characters with one uppercase letter and one number', function(value) {
      if (!value) return true; // Allow empty password (no change)
      return value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);
    }),
  location: yup.string().nullable(),
  occupation: yup.string().nullable(),
  picture: yup.mixed().nullable(),
});

const UpdateProfileForm = () => {
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user from Redux state instead of localStorage
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [user, token, navigate]);

  const handleFormSubmit = async (values, onSubmitProps) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Only add fields that have values
      if (values.firstName) formData.append("firstName", values.firstName);
      if (values.lastName) formData.append("lastName", values.lastName);
      if (values.email) formData.append("email", values.email);
      if (values.currentPassword) formData.append("currentPassword", values.currentPassword);
      if (values.newPassword) formData.append("newPassword", values.newPassword);
      if (values.location) formData.append("location", values.location);
      if (values.occupation) formData.append("occupation", values.occupation);
      if (values.picture) formData.append("picture", values.picture);

      const updatedUser = await apiRequest(`/auth/profile/${user._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (updatedUser) {
        dispatch(
          setLogin({
            user: updatedUser.user,
            token: updatedUser.token,
          })
        );
        navigate(`/profile/${user._id}`);
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Please log in to update your profile</Typography>
      </Box>
    );
  }

  return (
    <Formik
      onSubmit={handleFormSubmit}
      initialValues={{
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        location: user.location || "",
        occupation: user.occupation || "",
        picture: null
      }}
      validationSchema={updateSchema}
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        resetForm,
      }) => (
        <form onSubmit={handleSubmit}>
          <Box
            display="grid"
            gap="30px"
            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          >
            <TextField
              label="First Name"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.firstName}
              name="firstName"
              error={Boolean(touched.firstName) && Boolean(errors.firstName)}
              helperText={touched.firstName && errors.firstName}
              sx={{ gridColumn: "span 2" }}
            />
            <TextField
              label="Last Name"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.lastName}
              name="lastName"
              error={Boolean(touched.lastName) && Boolean(errors.lastName)}
              helperText={touched.lastName && errors.lastName}
              sx={{ gridColumn: "span 2" }}
            />
            <TextField
              label="Email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              name="email"
              error={Boolean(touched.email) && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              sx={{ gridColumn: "span 4" }}
            />
            <TextField
              label="Current Password"
              type="password"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.currentPassword}
              name="currentPassword"
              error={Boolean(touched.currentPassword) && Boolean(errors.currentPassword)}
              helperText={touched.currentPassword && errors.currentPassword}
              sx={{ gridColumn: "span 2" }}
            />
            <TextField
              label="New Password"
              type="password"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.newPassword}
              name="newPassword"
              error={Boolean(touched.newPassword) && Boolean(errors.newPassword)}
              helperText={touched.newPassword && errors.newPassword}
              sx={{ gridColumn: "span 2" }}
            />
            <TextField
              label="Location"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.location}
              name="location"
              error={Boolean(touched.location) && Boolean(errors.location)}
              helperText={touched.location && errors.location}
              sx={{ gridColumn: "span 4" }}
            />
            <TextField
              label="Occupation"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.occupation}
              name="occupation"
              error={Boolean(touched.occupation) && Boolean(errors.occupation)}
              helperText={touched.occupation && errors.occupation}
              sx={{ gridColumn: "span 4" }}
            />
            <Box
              gridColumn="span 4"
              border={`1px solid ${palette.neutral.medium}`}
              borderRadius="5px"
              p="1rem"
            >
              <Dropzone
                acceptedFiles=".jpg,.jpeg,.png"
                multiple={false}
                onDrop={(acceptedFiles) =>
                  setFieldValue("picture", acceptedFiles[0])
                }
              >
                {({ getRootProps, getInputProps }) => (
                  <Box
                    {...getRootProps()}
                    border={`2px dashed ${palette.primary.main}`}
                    p="1rem"
                    sx={{ "&:hover": { cursor: "pointer" } }}
                  >
                    <input {...getInputProps()} />
                    {!values.picture ? (
                      <p>Add Picture Here</p>
                    ) : (
                      <FlexBetween>
                        <Typography>{values.picture.name}</Typography>
                        <EditOutlinedIcon />
                      </FlexBetween>
                    )}
                  </Box>
                )}
              </Dropzone>
            </Box>
          </Box>

          {/* BUTTONS */}
          <Box>
            <Button
              fullWidth
              type="submit"
              disabled={loading}
              sx={{
                m: "2rem 0",
                p: "1rem",
                backgroundColor: palette.primary.main,
                color: palette.background.alt,
                "&:hover": { color: palette.primary.main },
              }}
            >
              {loading ? <CircularProgress size={24} /> : "UPDATE PROFILE"}
            </Button>
          </Box>
        </form>
      )}
    </Formik>
  );
};

export default UpdateProfileForm;
