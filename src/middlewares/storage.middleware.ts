import multer from 'multer';

const uploadStorage = (folder: string, type: string, filter) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = `public/uploads/${folder}`;
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname);
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 5,
    },
    fileFilter: filter,
  }).single(type);
};

const filterImage = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const filterPdf = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export default uploadStorage;
export { filterImage, filterPdf };
