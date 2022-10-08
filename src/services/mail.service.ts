import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import UserVerificationModel from '@models/User/UserVerification.model';
import { AUTH_EMAIL, AUTH_PASSWORD, CURRENT_URL } from '@config/config';
import { v4 as uuidv4 } from 'uuid';
import { HttpException } from '@exceptions/HttpException';
import { Response } from 'express';

export class MailService {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: AUTH_EMAIL,
      pass: AUTH_PASSWORD,
    },
  });

  sendEmailVerification = async (
    { _id, email }: { _id: Types.ObjectId; email: string },
    res: Response
  ) => {
    const uniqueString = uuidv4() + _id;

    // hash the unique string
    const hashedUniqueString = await bcrypt.hash(uniqueString, 10);

    const mailOptions = {
      form: 'ar.gent',
      to: email,
      subject: '[ar.get] Verify your email',
      html: `<p>Verify your email address to complete the signup and login into your account.</p><br />
      <p>This link will <b>expire in 6 hours</b>.</p><br />
      <p>Press <a href=${
        CURRENT_URL + 'auth/user/verify/' + _id + '/' + uniqueString
      }>here</a> to process.</p>`,
    };

    const newVerification = new UserVerificationModel({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 hours
    });

    newVerification
      .save()
      .then(() => {
        this.transporter.sendMail(mailOptions).then(() => {
          return res.status(201).json({
            code: 201,
            status: 'Pending',
            message: 'Verification email sent',
          });
        });
      })
      .catch((err) => {
        return res
          .status(400)
          .json(new HttpException(400, 'Email failed to send'));
      });
  };
}
