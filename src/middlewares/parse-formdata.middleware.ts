export const parseFormData = (req: any, _res: any, next: any) => {
  for (const key in req.body) {
    const value = req.body[key];

    if (value === "true") req.body[key] = true;
    else if (value === "false") req.body[key] = false;
    else if (!isNaN(value) && value !== "") req.body[key] = Number(value);
  }

  next();
};
