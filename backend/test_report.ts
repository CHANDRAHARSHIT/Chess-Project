import { OpponentController } from './src/controllers/opponent.controller.js';

const req = { params: { username: 'Zhigalko_Sergei' } };
const res = { 
  status: (s: number) => ({ 
    json: (data: any) => {
      console.log('--- White Recommendations ---');
      console.log(JSON.stringify(data.recommendationsAsWhite, null, 2));
      console.log('--- Black Recommendations ---');
      console.log(JSON.stringify(data.recommendationsAsBlack, null, 2));
    } 
  }) 
};

OpponentController.getReport(req as any, res as any);
