import nodemailer from "nodemailer";
import { Types } from "mongoose";
import ejs from "ejs";
import UserVerificationModel from "@models/User/UserVerification.model";
import { AUTH_EMAIL, AUTH_PASSWORD, FRONTEND_URL } from "@config/config";
import { HttpException } from "@exceptions/HttpException";
import { Response } from "express";
import UserResetPasswordModel from "@/models/User/UserResetPassword.model";
import jwt from "jsonwebtoken";
import { IDataStoredInToken } from "@/interfaces/auth.interface";
import IJob from "@/interfaces/job.interface";
import IUser from "@/interfaces/user.interface";

export class MailService {
  transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: AUTH_EMAIL,
      pass: AUTH_PASSWORD,
    },
  });

  sendEmailVerification = async ({ _id, email }: { _id: Types.ObjectId; email: string }, res: Response) => {
    const expireVerification = 1000 * 60 * 30; // 30 minutes

    const newVerification = new UserVerificationModel({
      userId: _id,
      createdAt: Date.now(),
      expiresAt: Date.now() + expireVerification,
    });

    newVerification
      .save()
      .then(() => {
        ejs.renderFile(
          "src/views/pages/email/confirmEmail.ejs",
          { email: email, frontendUrl: FRONTEND_URL, link: FRONTEND_URL + "verify/" + _id },
          (err, data) => {
            if (err) {
              console.log(err);
              return res.status(400).json(new HttpException(400, "Email failed to send"));
            } else {
              const mailOptions = {
                from: "ar.gent",
                to: email,
                subject: "[ar.get] Verify your email",
                html: data,
              };
              this.transporter.sendMail(mailOptions).then(() => {
                return res.status(201).json({
                  code: 201,
                  status: "Pending",
                  message: "Verification email has sent",
                  userId: _id,
                });
              });
            }
          }
        );
      })
      .catch((err) => {
        return res.status(400).json(new HttpException(400, "Email failed to send"));
      });
  };

  sendEmailResetPassword = async ({ _id, email }: { _id: Types.ObjectId; email: string }, res: Response) => {
    const expireResetPassword = 1000 * 60 * 60; // 1 hour

    const dataStoredInToken: IDataStoredInToken = {
      _id: _id.toString(),
    };

    const hashedUniqueString = jwt.sign(dataStoredInToken, process.env.RESET_PASSWORD_KEY, { expiresIn: expireResetPassword });

    const objectResetPassword = new UserResetPasswordModel({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + expireResetPassword,
    });

    objectResetPassword
      .save()
      .then(() => {
        ejs.renderFile(
          "src/views/pages/email/resetPassword.ejs",
          { email: email, link: FRONTEND_URL + "reset-password/" + hashedUniqueString },
          (err, data) => {
            if (err) {
              console.log(err);
              return res.status(400).json(new HttpException(400, "Email failed to send"));
            } else {
              const mailOptions = {
                from: "ar.gent",
                to: email,
                subject: "[ar.get] Reset Password",
                html: data,
              };

              this.transporter.sendMail(mailOptions).then(() => {
                return res.status(201).json({
                  code: 200,
                  status: "success",
                  message: "Link Reset password has been sent to your email",
                  linkResetPassword: FRONTEND_URL + "reset-password/" + hashedUniqueString,
                  uniqueString: hashedUniqueString,
                });
              });
            }
          }
        );
      })
      .catch((err) => {
        return res.status(400).json(new HttpException(400, "Email failed to send"));
      });
  };

  sendEmailApproveJob = async (email: string, message: string, jobData: IJob, userCreatedJob: IUser, res: Response) => {
    ejs.renderFile(
      "src/views/pages/email/approveJobTemplate.ejs",
      {
        email: email,
        frontendUrl: FRONTEND_URL,
        jobTitle: jobData.title,
        jobCity: jobData.location.city.name,
        jobCountry: jobData.location.country.name,
        message: message,
        userCreatedJob: userCreatedJob,
      },
      (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json(new HttpException(400, "Email failed to send"));
        } else {
          const mailOptions = {
            from: "ar.gent",
            to: email,
            subject: "[ar.get] Congratulation your job has been approved",
            html: data,
          };

          this.transporter
            .sendMail(mailOptions)
            .then(() => {
              return res.status(201).json({
                code: 200,
                status: "success",
                message: `User with ${email} has been approved`,
              });
            })
            .catch((err) => {
              return res.status(400).json(new HttpException(400, "Email failed to send"));
            });
        }
      }
    );
  };

  sendEmailRejectJob = async (email: string, message: string, jobData: IJob, userCreatedJob: IUser, res: Response) => {
    ejs.renderFile(
      "src/views/pages/email/rejectedJobTemplate.ejs",
      {
        email: email,
        frontendUrl: FRONTEND_URL,
        jobTitle: jobData.title,
        jobCity: jobData.location.city.name,
        jobCountry: jobData.location.country.name,
        message: message,
        userCreatedJob: userCreatedJob,
      },
      (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json(new HttpException(400, "Email failed to send"));
        } else {
          const mailOptions = {
            from: "ar.gent",
            to: email,
            subject: "[ar.get] Sorry your appliciant has been rejected",
            html: data,
          };
          this.transporter
            .sendMail(mailOptions)
            .then(() => {
              return res.status(201).json({
                code: 200,
                status: "success",
                message: `User with ${email} has been rejected`,
              });
            })
            .catch((err) => {
              return res.status(400).json(new HttpException(400, "Email failed to send"));
            });
        }
      }
    );
  };
}
