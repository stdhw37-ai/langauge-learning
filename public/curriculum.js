// Korean meaning | English | Japanese. One distinct communication goal per day.
const rows = `어서 오세요|Welcome to our pharmacy.|薬局へようこそ。
무엇을 도와드릴까요?|How can I help you?|どのようなご用件でしょうか。
저는 약사입니다|I'm the pharmacist.|私は薬剤師です。
영어로 말씀하시겠어요?|Would you like to speak English?|英語でお話ししますか。
일본어로 말씀하시겠어요?|Would you like to speak Japanese?|日本語でお話ししますか。
천천히 말씀해 주세요|Please speak slowly.|ゆっくり話してください。
다시 말씀해 주세요|Could you say that again?|もう一度言っていただけますか。
적어 주시겠어요?|Could you write it down?|書いていただけますか。
잠시만 기다려 주세요|Please wait a moment.|少々お待ちください。
여기에 앉아 주세요|Please have a seat here.|こちらにお掛けください。
누가 사용할 건가요?|Who is this for?|どなたがお使いになりますか。
본인이 사용하시나요?|Is this for you?|ご本人がお使いになりますか。
나이가 어떻게 되세요?|How old are you?|おいくつですか。
어린이를 위한 건가요?|Is this for a child?|お子様用ですか。
어떤 증상이 있으세요?|What symptoms do you have?|どのような症状がありますか。
어디가 불편하세요?|Where do you feel discomfort?|どのあたりがつらいですか。
언제 시작되었나요?|When did it start?|いつからですか。
얼마나 오래되었나요?|How long have you had this?|どのくらい続いていますか。
계속 그런가요?|Is it constant?|ずっと続いていますか。
전에도 이런 적이 있나요?|Has this happened before?|以前にも同じことがありましたか。
다른 증상도 있나요?|Do you have any other symptoms?|ほかに症状はありますか。
열이 있나요?|Do you have a fever?|熱はありますか。
기침이 나나요?|Do you have a cough?|せきは出ますか。
목이 아픈가요?|Do you have a sore throat?|のどは痛いですか。
콧물이 나나요?|Do you have a runny nose?|鼻水は出ますか。
코가 막히나요?|Do you have a blocked nose?|鼻は詰まっていますか。
머리가 아픈가요?|Do you have a headache?|頭は痛いですか。
배가 아픈가요?|Do you have a stomachache?|お腹は痛いですか。
메스꺼운가요?|Do you feel nauseous?|吐き気はありますか。
어지러운가요?|Do you feel dizzy?|めまいはありますか。
설사가 있나요?|Do you have diarrhea?|下痢はありますか。
변비가 있나요?|Are you constipated?|便秘ですか。
가려운가요?|Does it itch?|かゆいですか。
발진이 있나요?|Do you have a rash?|発疹はありますか。
벌레에 물렸나요?|Were you bitten by an insect?|虫に刺されましたか。
햇볕에 화상을 입었나요?|Do you have sunburn?|日焼けしましたか。
상처가 어디에 있나요?|Where is the wound?|傷はどこですか。
근육이 아픈가요?|Do your muscles hurt?|筋肉は痛いですか。
눈이 건조한가요?|Do your eyes feel dry?|目は乾きますか。
콘택트렌즈를 착용하시나요?|Do you wear contact lenses?|コンタクトレンズを使っていますか。
멀미가 나나요?|Do you get motion sickness?|乗り物酔いをしますか。
잠들기 어려운가요?|Do you have trouble falling asleep?|寝つきが悪いですか。
알레르기가 있나요?|Do you have any allergies?|アレルギーはありますか。
약 알레르기가 있나요?|Are you allergic to any medicines?|薬のアレルギーはありますか。
어떤 반응이 있었나요?|What kind of reaction did you have?|どのような反応が出ましたか。
현재 복용 중인 약이 있나요?|Are you taking any medicines?|今、飲んでいる薬はありますか。
약 이름을 알려 주세요|Please tell me the name of the medicine.|薬の名前を教えてください。
약 포장을 보여 주세요|Please show me the medicine packaging.|薬のパッケージを見せてください。
영양제를 드시나요?|Do you take any supplements?|サプリメントを飲んでいますか。
이미 드신 약이 있나요?|Have you taken anything for this already?|この症状のために、もう何か薬を飲みましたか。
마지막으로 언제 드셨나요?|When did you last take it?|最後に飲んだのはいつですか。
임신 중이신가요?|Are you pregnant?|妊娠していますか。
수유 중이신가요?|Are you breastfeeding?|授乳中ですか。
치료 중인 질환이 있나요?|Are you being treated for any medical conditions?|現在、治療中の病気はありますか。
처방전이 있나요?|Do you have a prescription?|処方箋はありますか。
처방전을 보여 주세요|Please show me your prescription.|処方箋を見せてください。
성함을 확인하겠습니다|Let me confirm your name.|お名前を確認させてください。
성분을 확인하겠습니다|Let me check the ingredients.|成分を確認します。
함께 사용할 수 있는지 확인하겠습니다|Let me check if these can be used together.|一緒に使えるか確認します。
약사에게 추가로 확인하겠습니다|Let me check with another pharmacist.|ほかの薬剤師に確認します。
사용법을 설명해 드리겠습니다|I'll explain how to use it.|使い方をご説明します。
라벨을 함께 확인하겠습니다|Let's look at the label together.|一緒にラベルを確認しましょう。
복용량을 확인하겠습니다|Let me check the dose.|服用量を確認します。
복용 시간을 확인하겠습니다|Let me check when to take it.|飲むタイミングを確認します。
며칠분이 필요한가요?|How many days' supply do you need?|何日分が必要ですか。
설명서를 읽어 주세요|Please read the instructions.|説明書を読んでください。
이 부분을 봐 주세요|Please look at this section.|こちらの部分をご覧ください。
계량 도구가 있나요?|Do you have a measuring device?|計量する道具はありますか。
보관 방법을 확인하겠습니다|Let me check how to store it.|保管方法を確認します。
유효기간은 여기에 있습니다|The expiration date is here.|使用期限はこちらです。
주의사항을 설명하겠습니다|I'll explain the precautions.|注意事項をご説明します。
운전할 예정인가요?|Are you planning to drive?|運転する予定はありますか。
이해가 되셨나요?|Was that clear?|ご理解いただけましたか。
사용법을 다시 말씀해 주시겠어요?|Could you repeat how you will use it?|使い方をもう一度教えていただけますか。
다른 질문이 있나요?|Do you have any other questions?|ほかにご質問はありますか。
다시 설명해 드리겠습니다|I'll explain it again.|もう一度ご説明します。
글로 적어 드리겠습니다|I'll write it down for you.|書いてお渡しします。
의사와 상담하셨나요?|Have you spoken to a doctor?|医師に相談しましたか。
가까운 병원을 찾고 계신가요?|Are you looking for a nearby clinic?|近くの病院をお探しですか。
도움을 요청해 드릴까요?|Would you like me to call for help?|助けを呼びましょうか。
재고를 확인하겠습니다|Let me check if it is in stock.|在庫を確認します。
현재 재고가 없습니다|We don't have it in stock right now.|ただいま在庫がありません。
가격은 여기에 표시되어 있습니다|The price is shown here.|価格はこちらに表示されています。
카드로 결제하시겠어요?|Would you like to pay by card?|カードでお支払いになりますか。
현금으로 결제하시겠어요?|Would you like to pay in cash?|現金でお支払いになりますか。
영수증이 필요하신가요?|Would you like a receipt?|レシートは必要ですか。
봉투가 필요하신가요?|Would you like a bag?|袋は必要ですか。
소지품을 확인해 주세요|Please check that you have all your belongings.|お忘れ物がないかご確認ください。
좋은 여행 되세요|Enjoy the rest of your trip.|引き続き、よいご旅行を。
방문해 주셔서 감사합니다|Thank you for visiting us.|ご来店ありがとうございました。`;
export const lessons = rows.split('\n').map((row, index) => {
  const [ko, en, ja] = row.split('|');
  return { id: index + 1, month: Math.floor(index / 30) + 1, ko, en, ja };
});
export const months = ['첫 만남과 기본 문진', '증상과 배경 확인', '안내와 상담 마무리'];
