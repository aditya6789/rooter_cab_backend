export const generateReferralCode = (name: string): string => {
    const timestamp = Date.now().toString();
    return `${name.slice(0, 3).toUpperCase()}${timestamp.slice(-5)}`;
  };
  