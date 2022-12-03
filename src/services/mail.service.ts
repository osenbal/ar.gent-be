import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import UserVerificationModel from "@models/User/UserVerification.model";
import { AUTH_EMAIL, AUTH_PASSWORD, CURRENT_URL, FRONTEND_URL } from "@config/config";
import { v4 as uuidv4 } from "uuid";
import { HttpException } from "@exceptions/HttpException";
import { Response } from "express";
import UserResetPasswordModel from "@/models/User/UserResetPassword.model";
import jwt from "jsonwebtoken";
import { IDataStoredInToken } from "@/interfaces/auth.interface";

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
    const mailOptions = {
      from: "ar.gent",
      to: email,
      subject: "[ar.get] Verify your email",
      html: `<p>Verify your email address to complete the signup and login into your account.</p><br />
      <p>This link will <b>expire in 6 hours</b>.</p><br />
      <p>Press <a href=${FRONTEND_URL + "verify/" + _id}>here</a> to process.</p>`,
    };

    const newVerification = new UserVerificationModel({
      userId: _id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 hours
    });

    newVerification
      .save()
      .then(() => {
        this.transporter.sendMail(mailOptions).then(() => {
          return res.status(201).json({
            code: 201,
            status: "Pending",
            message: "Verification email sent",
            userId: _id,
          });
        });
      })
      .catch((err) => {
        return res.status(400).json(new HttpException(400, "Email failed to send"));
      });
  };

  sendEmailResetPassword = async ({ _id, email }: { _id: Types.ObjectId; email: string }, res: Response) => {
    const dataStoredInToken: IDataStoredInToken = {
      _id: _id.toString(),
    };

    const hashedUniqueString = jwt.sign(dataStoredInToken, process.env.RESET_PASSWORD_KEY, { expiresIn: 1000 * 60 * 10 });

    const mailOptions = {
      from: "ar.gent",
      to: email,
      subject: "[ar.get] Reset Password",
      html: `<p>Reset your password</p><br />
      <p>This link will <b>expire in 10 minutes</b>.</p><br />
      <p>Press <a href=${FRONTEND_URL + "reset-password/" + hashedUniqueString}>here</a> to process.</p>`,
    };

    const objectResetPassword = new UserResetPasswordModel({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000 * 10, // 10 minutes
    });

    objectResetPassword
      .save()
      .then(() => {
        this.transporter.sendMail(mailOptions).then(() => {
          return res.status(201).json({
            code: 200,
            status: "success",
            message: "Link Reset password has been sent to your email",
            uniqueString: hashedUniqueString,
          });
        });
      })
      .catch((err) => {
        return res.status(400).json(new HttpException(400, "Email failed to send"));
      });
  };
}
