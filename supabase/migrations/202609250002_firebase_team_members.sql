-- Restore historical Firebase team memberships for the Mumbai temple page.
-- Source: Firestore profiles.desc fields where the description clearly listed member names.
-- Ambiguous prose/non-roster descriptions are intentionally NOT guessed.
-- This does not modify historical distributions, book totals, points, campaigns, or reports.
begin;
set local statement_timeout = '0';

create temporary table _firebase_team_member_seed (
  team_id uuid not null,
  member_name text not null,
  source_uid text not null,
  source_team_name text not null
) on commit drop;

insert into _firebase_team_member_seed(team_id, member_name, source_uid, source_team_name) values
  ('85861357-9e68-5a7f-b14f-7fb14cc4e20a'::uuid,'sanjay','2024_SY_100181086618326002622','Nitai gauranga'),
  ('85861357-9e68-5a7f-b14f-7fb14cc4e20a'::uuid,'aniket','2024_SY_100181086618326002622','Nitai gauranga'),
  ('85861357-9e68-5a7f-b14f-7fb14cc4e20a'::uuid,'kotesh','2024_SY_100181086618326002622','Nitai gauranga'),
  ('735f86f8-6e08-5f1c-a522-080c01b8d97d'::uuid,'Ashtesh Kumar','2024_SY_100250080463984889873','Radha Damodara Sankirtan Party'),
  ('735f86f8-6e08-5f1c-a522-080c01b8d97d'::uuid,'Ashu Chaudhary','2024_SY_100250080463984889873','Radha Damodara Sankirtan Party'),
  ('735f86f8-6e08-5f1c-a522-080c01b8d97d'::uuid,'Rajat Kumar','2024_SY_100250080463984889873','Radha Damodara Sankirtan Party'),
  ('337f0083-a93c-52a2-bc1b-bd3b2f0076ec'::uuid,'Bhavana Chavan','2024_SY_100337228801682133642','Nimai Nitai'),
  ('337f0083-a93c-52a2-bc1b-bd3b2f0076ec'::uuid,'Rajesh Chavan','2024_SY_100337228801682133642','Nimai Nitai'),
  ('337f0083-a93c-52a2-bc1b-bd3b2f0076ec'::uuid,'Rashmil Chavan','2024_SY_100337228801682133642','Nimai Nitai'),
  ('ae94583c-7a24-5da2-bbec-a4ed169f10a6'::uuid,'Jagannath','2024_SY_100374499284770167113','Patit Pawan Sankirtan Party'),
  ('ae94583c-7a24-5da2-bbec-a4ed169f10a6'::uuid,'Devendra','2024_SY_100374499284770167113','Patit Pawan Sankirtan Party'),
  ('ae94583c-7a24-5da2-bbec-a4ed169f10a6'::uuid,'Yash Prajapati','2024_SY_100374499284770167113','Patit Pawan Sankirtan Party'),
  ('0e961d69-87e6-5e27-a6ce-630e33434fea'::uuid,'Ayush','2024_SY_100726657938607572931','Akinchana Vittaya 2'),
  ('0e961d69-87e6-5e27-a6ce-630e33434fea'::uuid,'Aniket','2024_SY_100726657938607572931','Akinchana Vittaya 2'),
  ('0e961d69-87e6-5e27-a6ce-630e33434fea'::uuid,'Rohit','2024_SY_100726657938607572931','Akinchana Vittaya 2'),
  ('8da96b51-9376-575e-bd5d-e5c6fff6c279'::uuid,'Abhinandan','2024_SY_101130955915558142409','Prem Bhakti Prachar'),
  ('8da96b51-9376-575e-bd5d-e5c6fff6c279'::uuid,'Kanha','2024_SY_101130955915558142409','Prem Bhakti Prachar'),
  ('8da96b51-9376-575e-bd5d-e5c6fff6c279'::uuid,'Shubham','2024_SY_101130955915558142409','Prem Bhakti Prachar'),
  ('567ef792-2872-522e-9e71-4993f451b216'::uuid,'Vignesh Prabhu','2024_SY_101292967654576318755','Vasudev'),
  ('567ef792-2872-522e-9e71-4993f451b216'::uuid,'Mugesh Prabhu','2024_SY_101292967654576318755','Vasudev'),
  ('7cc6a21d-a7da-59ad-8827-ddb4ed7526c9'::uuid,'Smeet Chavan','2024_SY_101757055869651837411','Rupanugas'),
  ('7cc6a21d-a7da-59ad-8827-ddb4ed7526c9'::uuid,'Toshit Gupta','2024_SY_101757055869651837411','Rupanugas'),
  ('7cc6a21d-a7da-59ad-8827-ddb4ed7526c9'::uuid,'Prathmesh Gaonkar','2024_SY_101757055869651837411','Rupanugas'),
  ('d6554eac-524e-5fc5-a9c8-5495ea04a9e8'::uuid,'Prachi Singh','2024_SY_102173723914461560525','Padmanabh'),
  ('d6554eac-524e-5fc5-a9c8-5495ea04a9e8'::uuid,'Hritika Salvi','2024_SY_102173723914461560525','Padmanabh'),
  ('367bdaf3-b51d-5f0c-bb53-064d7fecb5a9'::uuid,'Kaustav Kishor','2024_SY_102195881755994889445','Govind Gita Daan'),
  ('367bdaf3-b51d-5f0c-bb53-064d7fecb5a9'::uuid,'Aakash Paul','2024_SY_102195881755994889445','Govind Gita Daan'),
  ('367bdaf3-b51d-5f0c-bb53-064d7fecb5a9'::uuid,'Vikas Tiwari','2024_SY_102195881755994889445','Govind Gita Daan'),
  ('edbfadd4-a03b-541f-a87f-44f2a5e01517'::uuid,'Raj Prabhu','2024_SY_102935484478299259538','Akinchana Vittaya 1'),
  ('edbfadd4-a03b-541f-a87f-44f2a5e01517'::uuid,'Akash R Prabhu','2024_SY_102935484478299259538','Akinchana Vittaya 1'),
  ('edbfadd4-a03b-541f-a87f-44f2a5e01517'::uuid,'Shubham Shukla Prabhu','2024_SY_102935484478299259538','Akinchana Vittaya 1'),
  ('0eefba66-8bdb-5f17-8d08-00193d9922d5'::uuid,'shivam','2024_SY_102941587597991317462','Prahlada Maharaj'),
  ('0eefba66-8bdb-5f17-8d08-00193d9922d5'::uuid,'Shubham','2024_SY_102941587597991317462','Prahlada Maharaj'),
  ('77b94435-203b-5d08-8c33-d0a51f9114b7'::uuid,'Mukul','2024_SY_103688152417179302030','Akinchana Vittaya - 4'),
  ('77b94435-203b-5d08-8c33-d0a51f9114b7'::uuid,'Himank','2024_SY_103688152417179302030','Akinchana Vittaya - 4'),
  ('77b94435-203b-5d08-8c33-d0a51f9114b7'::uuid,'Kunal','2024_SY_103688152417179302030','Akinchana Vittaya - 4'),
  ('77b94435-203b-5d08-8c33-d0a51f9114b7'::uuid,'Akash agnihotri','2024_SY_103688152417179302030','Akinchana Vittaya - 4'),
  ('63bb1225-4909-5ada-94db-f6bb779867b7'::uuid,'Aditya','2024_SY_104384469678323974977','Gaur Nitai'),
  ('63bb1225-4909-5ada-94db-f6bb779867b7'::uuid,'Nilesh','2024_SY_104384469678323974977','Gaur Nitai'),
  ('63bb1225-4909-5ada-94db-f6bb779867b7'::uuid,'Abhijit','2024_SY_104384469678323974977','Gaur Nitai'),
  ('63bb1225-4909-5ada-94db-f6bb779867b7'::uuid,'Haresh','2024_SY_104384469678323974977','Gaur Nitai'),
  ('0d640059-c0a0-53e5-9242-af24455bfdd6'::uuid,'Vishnu Nishad','2024_SY_106354572049701867213','Vishnu Sahasranamam'),
  ('0d640059-c0a0-53e5-9242-af24455bfdd6'::uuid,'Dhiraj Gupta','2024_SY_106354572049701867213','Vishnu Sahasranamam'),
  ('0d640059-c0a0-53e5-9242-af24455bfdd6'::uuid,'Aditya Chaudhary','2024_SY_106354572049701867213','Vishnu Sahasranamam'),
  ('de2c6cae-88ee-529e-b6d5-08ca5b3f7392'::uuid,'Sahil Negi','2024_SY_106635020796556006607','Sri Bhagwan Uvacha'),
  ('de2c6cae-88ee-529e-b6d5-08ca5b3f7392'::uuid,'Vedang Gandhalikar','2024_SY_106635020796556006607','Sri Bhagwan Uvacha'),
  ('de2c6cae-88ee-529e-b6d5-08ca5b3f7392'::uuid,'Suraj Menon','2024_SY_106635020796556006607','Sri Bhagwan Uvacha'),
  ('29a90eb2-f031-5ede-8b2f-891258997923'::uuid,'Akshar Baldev Prabhu','2024_SY_106858479718915654927','Servants of Rupanugas'),
  ('29a90eb2-f031-5ede-8b2f-891258997923'::uuid,'Bh Aditya','2024_SY_106858479718915654927','Servants of Rupanugas'),
  ('29a90eb2-f031-5ede-8b2f-891258997923'::uuid,'Bh Hemang','2024_SY_106858479718915654927','Servants of Rupanugas'),
  ('29a90eb2-f031-5ede-8b2f-891258997923'::uuid,'Bh Abinash','2024_SY_106858479718915654927','Servants of Rupanugas'),
  ('486ada33-6dbf-5452-88f8-6189950de430'::uuid,'Anil Gupta','2024_SY_107586059342721010091','Prabhupadanugas (FOLK SION)'),
  ('486ada33-6dbf-5452-88f8-6189950de430'::uuid,'Shivam Gupta','2024_SY_107586059342721010091','Prabhupadanugas (FOLK SION)'),
  ('486ada33-6dbf-5452-88f8-6189950de430'::uuid,'Jaipur Devotees','2024_SY_107586059342721010091','Prabhupadanugas (FOLK SION)'),
  ('b860cdc0-1af5-5f55-bef1-98206285a03b'::uuid,'Raj','2024_SY_108228646387120485601','Akinchana Vittaya - 3'),
  ('b860cdc0-1af5-5f55-bef1-98206285a03b'::uuid,'Vasu','2024_SY_108228646387120485601','Akinchana Vittaya - 3'),
  ('b860cdc0-1af5-5f55-bef1-98206285a03b'::uuid,'Mahesh','2024_SY_108228646387120485601','Akinchana Vittaya - 3'),
  ('b860cdc0-1af5-5f55-bef1-98206285a03b'::uuid,'Aniket','2024_SY_108228646387120485601','Akinchana Vittaya - 3'),
  ('f78c9247-928d-5daa-8b76-7b2ce629d79a'::uuid,'Gaur Hari Dasa Pr','2024_SY_108297235601236401509','Prabhupada''s Dasa'),
  ('f78c9247-928d-5daa-8b76-7b2ce629d79a'::uuid,'Yogesh Pr','2024_SY_108297235601236401509','Prabhupada''s Dasa'),
  ('ce0c225c-2a55-54d3-a74c-eb245f4a8d06'::uuid,'Madhav Mittal','2024_SY_108620424448376200822','Nama-hatta'),
  ('ce0c225c-2a55-54d3-a74c-eb245f4a8d06'::uuid,'Yash Gupta','2024_SY_108620424448376200822','Nama-hatta'),
  ('ce0c225c-2a55-54d3-a74c-eb245f4a8d06'::uuid,'Ganesh Ranjane','2024_SY_108620424448376200822','Nama-hatta'),
  ('888f165e-1c28-5e65-b1fc-578d7f814d33'::uuid,'Vijay Pr','2024_SY_109025835961041266548','Servants of Prabhupada'),
  ('888f165e-1c28-5e65-b1fc-578d7f814d33'::uuid,'Kaustav Pr','2024_SY_109025835961041266548','Servants of Prabhupada'),
  ('888f165e-1c28-5e65-b1fc-578d7f814d33'::uuid,'Manish','2024_SY_109025835961041266548','Servants of Prabhupada'),
  ('888f165e-1c28-5e65-b1fc-578d7f814d33'::uuid,'Shubham Pr','2024_SY_109025835961041266548','Servants of Prabhupada'),
  ('ef817b9e-bef8-51ee-a0ab-1b786bdcdde1'::uuid,'Parth','2024_SY_109194494956770043671','Neophytes'),
  ('ef817b9e-bef8-51ee-a0ab-1b786bdcdde1'::uuid,'Yashwant','2024_SY_109194494956770043671','Neophytes'),
  ('ef817b9e-bef8-51ee-a0ab-1b786bdcdde1'::uuid,'Rakesh Ji','2024_SY_109194494956770043671','Neophytes'),
  ('ed4beee4-2a00-5827-9298-02c638194bb1'::uuid,'Devang','2024_SY_109374506075266018308','Padmā Vākya'),
  ('ed4beee4-2a00-5827-9298-02c638194bb1'::uuid,'Bharat','2024_SY_109374506075266018308','Padmā Vākya'),
  ('ed4beee4-2a00-5827-9298-02c638194bb1'::uuid,'Aman pr','2024_SY_109374506075266018308','Padmā Vākya'),
  ('ed4beee4-2a00-5827-9298-02c638194bb1'::uuid,'Sunny pr','2024_SY_109374506075266018308','Padmā Vākya'),
  ('2c368bb6-8ec2-5ec8-b398-d116364d3554'::uuid,'Sanjay','2024_SY_110529525571505544530','Nitai Gauranga'),
  ('2c368bb6-8ec2-5ec8-b398-d116364d3554'::uuid,'Aniket','2024_SY_110529525571505544530','Nitai Gauranga'),
  ('2c368bb6-8ec2-5ec8-b398-d116364d3554'::uuid,'Kotesh','2024_SY_110529525571505544530','Nitai Gauranga'),
  ('2b86ae78-1d15-59dd-a72f-c597036a317d'::uuid,'Bhumit','2024_SY_111267059810159883541','Sri Krishna Chaitanya'),
  ('2b86ae78-1d15-59dd-a72f-c597036a317d'::uuid,'Sujeet','2024_SY_111267059810159883541','Sri Krishna Chaitanya'),
  ('2b86ae78-1d15-59dd-a72f-c597036a317d'::uuid,'Sumit','2024_SY_111267059810159883541','Sri Krishna Chaitanya'),
  ('9a29b714-43d0-5be3-82a3-b0397597a3bf'::uuid,'Vasu prabhu','2024_SY_112202531276827391296','Akinchana vittaya 3'),
  ('8b284248-e980-5429-a9b2-8a58d4c29f27'::uuid,'Shriraj','2024_SY_112431748837452982595','Baldeva 1'),
  ('8b284248-e980-5429-a9b2-8a58d4c29f27'::uuid,'Nilesh','2024_SY_112431748837452982595','Baldeva 1'),
  ('8b284248-e980-5429-a9b2-8a58d4c29f27'::uuid,'Rohit','2024_SY_112431748837452982595','Baldeva 1'),
  ('8b284248-e980-5429-a9b2-8a58d4c29f27'::uuid,'Hardik','2024_SY_112431748837452982595','Baldeva 1'),
  ('f9862cb6-8fad-5ad9-824a-d983755c5d2f'::uuid,'Harshal Deshmukh','2024_SY_113459059138564995447','MadanMohan'),
  ('f9862cb6-8fad-5ad9-824a-d983755c5d2f'::uuid,'Aanand Singh','2024_SY_113459059138564995447','MadanMohan'),
  ('f9862cb6-8fad-5ad9-824a-d983755c5d2f'::uuid,'Abhinav Sahu','2024_SY_113459059138564995447','MadanMohan'),
  ('9ad9d068-6f83-5e74-931a-073b483aebff'::uuid,'Shubham Shukla Prabhu','2024_SY_114675401274332712189','Sri Sri Nitai Gauranga'),
  ('9ad9d068-6f83-5e74-931a-073b483aebff'::uuid,'Haresh Lodhi Prabhu','2024_SY_114675401274332712189','Sri Sri Nitai Gauranga'),
  ('d2e49a9f-eb89-5dde-9f04-4128fb79c238'::uuid,'Aachal mata ji','2024_SY_114865121337531924703','Sri radha rani'),
  ('d2e49a9f-eb89-5dde-9f04-4128fb79c238'::uuid,'Shalini Mataji','2024_SY_114865121337531924703','Sri radha rani'),
  ('d2e49a9f-eb89-5dde-9f04-4128fb79c238'::uuid,'suvarna mata ji','2024_SY_114865121337531924703','Sri radha rani'),
  ('7e875c86-bd51-5414-a670-1b402396ad5a'::uuid,'Himanshu','2024_SY_115909003923083144350','Baldeva'),
  ('7e875c86-bd51-5414-a670-1b402396ad5a'::uuid,'Saurabh','2024_SY_115909003923083144350','Baldeva'),
  ('7e875c86-bd51-5414-a670-1b402396ad5a'::uuid,'hardik','2024_SY_115909003923083144350','Baldeva'),
  ('7e875c86-bd51-5414-a670-1b402396ad5a'::uuid,'shriraj','2024_SY_115909003923083144350','Baldeva'),
  ('ba73701b-3339-5edf-9636-ac1e80f92d54'::uuid,'Prem','2024_SY_116270738415720157751','Team Narasimha'),
  ('ba73701b-3339-5edf-9636-ac1e80f92d54'::uuid,'Yash','2024_SY_116270738415720157751','Team Narasimha'),
  ('ba73701b-3339-5edf-9636-ac1e80f92d54'::uuid,'Suvajit','2024_SY_116270738415720157751','Team Narasimha'),
  ('ba73701b-3339-5edf-9636-ac1e80f92d54'::uuid,'Sanjay','2024_SY_116270738415720157751','Team Narasimha'),
  ('b9c876d9-1bfe-5f1d-9342-f8362f928a12'::uuid,'Raju prabhuji','2024_SY_116614745959119279973','Srila prabhupada Warriors'),
  ('b9c876d9-1bfe-5f1d-9342-f8362f928a12'::uuid,'Roshan prabhu','2024_SY_116614745959119279973','Srila prabhupada Warriors'),
  ('683d98d2-3723-5f27-a853-ac20ff82d35f'::uuid,'Mamta Mata ji','2024_SY_117861921218446515964','Sri Vrindavaneshwari'),
  ('683d98d2-3723-5f27-a853-ac20ff82d35f'::uuid,'Mahek Mata ji','2024_SY_117861921218446515964','Sri Vrindavaneshwari'),
  ('683d98d2-3723-5f27-a853-ac20ff82d35f'::uuid,'Poornima Mata ji','2024_SY_117861921218446515964','Sri Vrindavaneshwari'),
  ('16726d1c-72ea-536b-9862-ae2ad55da3f4'::uuid,'Kunal','2024_SY_118244126761719338823','Dāsānudāsa'),
  ('16726d1c-72ea-536b-9862-ae2ad55da3f4'::uuid,'Abhay','2024_SY_118244126761719338823','Dāsānudāsa'),
  ('223bb8e9-fbad-5859-b06c-214669672ea7'::uuid,'Dinesh Satyani','2024_SY_118316657916405904511','Saving Civilization'),
  ('223bb8e9-fbad-5859-b06c-214669672ea7'::uuid,'Sai Teja','2024_SY_118316657916405904511','Saving Civilization'),
  ('223bb8e9-fbad-5859-b06c-214669672ea7'::uuid,'Uppada Venkatesh','2024_SY_118316657916405904511','Saving Civilization'),
  ('223bb8e9-fbad-5859-b06c-214669672ea7'::uuid,'Dhanujay','2024_SY_118316657916405904511','Saving Civilization'),
  ('3cd6eaeb-e0a9-57fd-881b-c3f6f4da161e'::uuid,'Anshul','4eRl0Mt06idvS2VM6DbeDbxCzr22','Jwala Narasimha'),
  ('3cd6eaeb-e0a9-57fd-881b-c3f6f4da161e'::uuid,'Sagar','4eRl0Mt06idvS2VM6DbeDbxCzr22','Jwala Narasimha'),
  ('3cd6eaeb-e0a9-57fd-881b-c3f6f4da161e'::uuid,'Sahil','4eRl0Mt06idvS2VM6DbeDbxCzr22','Jwala Narasimha'),
  ('3cd6eaeb-e0a9-57fd-881b-c3f6f4da161e'::uuid,'Akash','4eRl0Mt06idvS2VM6DbeDbxCzr22','Jwala Narasimha'),
  ('46085cd4-521a-5f44-a705-e5a77c1170fa'::uuid,'Vivek Tiwari','6T96y7ac3bQB6rHgGHswsW56Dof2','Gauranga'),
  ('7522367e-3363-5e47-b11b-76b5c23d1a94'::uuid,'Om Nilesh','7sJDNFP17fV3pYMvYv51ZtZGYg42','Narayana Prabhavshetra'),
  ('7522367e-3363-5e47-b11b-76b5c23d1a94'::uuid,'Surya Gupta','7sJDNFP17fV3pYMvYv51ZtZGYg42','Narayana Prabhavshetra'),
  ('0dce814a-3dad-5b26-9b9b-464312108b93'::uuid,'Amish','8wssNzmNP3VJ66uX6SAuO5F07fC2','Ugra Narsimha'),
  ('0dce814a-3dad-5b26-9b9b-464312108b93'::uuid,'Gaurav','8wssNzmNP3VJ66uX6SAuO5F07fC2','Ugra Narsimha'),
  ('0dce814a-3dad-5b26-9b9b-464312108b93'::uuid,'Avdhes','8wssNzmNP3VJ66uX6SAuO5F07fC2','Ugra Narsimha'),
  ('3beed1e1-0cb8-5061-a278-65f72acea78b'::uuid,'Abhishek','B8kQJQb9aGMBjQPfCds4cGEwaul2','Krishnite'),
  ('3beed1e1-0cb8-5061-a278-65f72acea78b'::uuid,'Ajinkya','B8kQJQb9aGMBjQPfCds4cGEwaul2','Krishnite'),
  ('3beed1e1-0cb8-5061-a278-65f72acea78b'::uuid,'Jaswanth','B8kQJQb9aGMBjQPfCds4cGEwaul2','Krishnite'),
  ('0f34e3be-12c8-57fd-819f-c6189c73b74b'::uuid,'Manish','CArJEt8o1YOD0SBZireQjg7hpjg1','Servants of Prabhupada'),
  ('0f34e3be-12c8-57fd-819f-c6189c73b74b'::uuid,'Shubham','CArJEt8o1YOD0SBZireQjg7hpjg1','Servants of Prabhupada'),
  ('0f34e3be-12c8-57fd-819f-c6189c73b74b'::uuid,'Anirudh','CArJEt8o1YOD0SBZireQjg7hpjg1','Servants of Prabhupada'),
  ('0f34e3be-12c8-57fd-819f-c6189c73b74b'::uuid,'Thirupathi','CArJEt8o1YOD0SBZireQjg7hpjg1','Servants of Prabhupada'),
  ('db858d6d-f7de-5b58-be59-0a0142c1b333'::uuid,'Vrajnayak Pr','EjPgeBrloFZXqz3DErZuc9VLDsw1','Bhaktivedanta Brigadiers'),
  ('db858d6d-f7de-5b58-be59-0a0142c1b333'::uuid,'Naman','EjPgeBrloFZXqz3DErZuc9VLDsw1','Bhaktivedanta Brigadiers'),
  ('db858d6d-f7de-5b58-be59-0a0142c1b333'::uuid,'Rajat','EjPgeBrloFZXqz3DErZuc9VLDsw1','Bhaktivedanta Brigadiers'),
  ('45d4b7d5-50ad-567e-b9d4-25c8db6d3e1a'::uuid,'Prem','GGliHsitTIS5nwmDKA0E0TmNCBo2','Team Narasimha'),
  ('45d4b7d5-50ad-567e-b9d4-25c8db6d3e1a'::uuid,'Yash','GGliHsitTIS5nwmDKA0E0TmNCBo2','Team Narasimha'),
  ('45d4b7d5-50ad-567e-b9d4-25c8db6d3e1a'::uuid,'Suvajit','GGliHsitTIS5nwmDKA0E0TmNCBo2','Team Narasimha'),
  ('45d4b7d5-50ad-567e-b9d4-25c8db6d3e1a'::uuid,'Sanjay','GGliHsitTIS5nwmDKA0E0TmNCBo2','Team Narasimha'),
  ('051fef6d-7b47-51c6-827f-a7e86ddb03ff'::uuid,'Harshal Deshmukh','KfjFZyDhyiSC9f9EPtaVxzYFh233','Madanmohan'),
  ('051fef6d-7b47-51c6-827f-a7e86ddb03ff'::uuid,'Aanand Singh','KfjFZyDhyiSC9f9EPtaVxzYFh233','Madanmohan'),
  ('051fef6d-7b47-51c6-827f-a7e86ddb03ff'::uuid,'Rama','KfjFZyDhyiSC9f9EPtaVxzYFh233','Madanmohan'),
  ('051fef6d-7b47-51c6-827f-a7e86ddb03ff'::uuid,'Vishal','KfjFZyDhyiSC9f9EPtaVxzYFh233','Madanmohan'),
  ('9851525d-48e3-5320-9926-d66fbcf94cec'::uuid,'Shyam Chauhan','Nea3cMrAmlNbC92G11hhDjyCP9N2','Shyam Chouhan'),
  ('9851525d-48e3-5320-9926-d66fbcf94cec'::uuid,'Gaurav Yadav','Nea3cMrAmlNbC92G11hhDjyCP9N2','Shyam Chouhan'),
  ('9851525d-48e3-5320-9926-d66fbcf94cec'::uuid,'Hitesh Sarma','Nea3cMrAmlNbC92G11hhDjyCP9N2','Shyam Chouhan'),
  ('c0db67e2-adc9-5c64-809b-680ade3fa13f'::uuid,'Anuj','SN4hvWViTMR2KrPY5ZRtg1I0XjF3','Back To Godhead'),
  ('c0db67e2-adc9-5c64-809b-680ade3fa13f'::uuid,'Onkar','SN4hvWViTMR2KrPY5ZRtg1I0XjF3','Back To Godhead'),
  ('c0db67e2-adc9-5c64-809b-680ade3fa13f'::uuid,'VIGHNESH','SN4hvWViTMR2KrPY5ZRtg1I0XjF3','Back To Godhead'),
  ('c0db67e2-adc9-5c64-809b-680ade3fa13f'::uuid,'ALPESH','SN4hvWViTMR2KrPY5ZRtg1I0XjF3','Back To Godhead'),
  ('51b9e1db-ebd4-5038-8d00-fe394607587b'::uuid,'Kunal','SxHn6lJp8Dbcbb2MsNlhPFLvdCs2','Dāsānudāsa'),
  ('51b9e1db-ebd4-5038-8d00-fe394607587b'::uuid,'Abhay','SxHn6lJp8Dbcbb2MsNlhPFLvdCs2','Dāsānudāsa'),
  ('e9b2bfe0-df70-5c46-8d4b-ba4bb31735ae'::uuid,'Haresh Lodhi','UNFB8P1BTRMUigrQSayusvmP4IM2','Govinda'),
  ('e9b2bfe0-df70-5c46-8d4b-ba4bb31735ae'::uuid,'Aashish Upadhey','UNFB8P1BTRMUigrQSayusvmP4IM2','Govinda'),
  ('e9b2bfe0-df70-5c46-8d4b-ba4bb31735ae'::uuid,'Prathamesh Dhebe','UNFB8P1BTRMUigrQSayusvmP4IM2','Govinda'),
  ('d544d5e1-e586-589d-aac5-796bf174112e'::uuid,'Kunal Singh Rajput','aRVKcAfeF3dLp61xCJPOagHnZyA2','Servants of Srimati Radharani'),
  ('d544d5e1-e586-589d-aac5-796bf174112e'::uuid,'Yashwant Ostwal','aRVKcAfeF3dLp61xCJPOagHnZyA2','Servants of Srimati Radharani'),
  ('d544d5e1-e586-589d-aac5-796bf174112e'::uuid,'Sahil Shukla','aRVKcAfeF3dLp61xCJPOagHnZyA2','Servants of Srimati Radharani'),
  ('74fcb41f-9f19-53c5-9b26-de039a69fbb7'::uuid,'Asthesh Kumar','d7E9FqFSILPRs1zkZoisbOTFrRF3','Wings Of Garuda'),
  ('74fcb41f-9f19-53c5-9b26-de039a69fbb7'::uuid,'Divyansh Rathore','d7E9FqFSILPRs1zkZoisbOTFrRF3','Wings Of Garuda'),
  ('74fcb41f-9f19-53c5-9b26-de039a69fbb7'::uuid,'Rudra Singh','d7E9FqFSILPRs1zkZoisbOTFrRF3','Wings Of Garuda'),
  ('74fcb41f-9f19-53c5-9b26-de039a69fbb7'::uuid,'Robin','d7E9FqFSILPRs1zkZoisbOTFrRF3','Wings Of Garuda'),
  ('b526452b-245e-5d73-a0d0-4b2037b2e8c3'::uuid,'ABD','wkWvkcJRJXTSWmYX7CIihRJ8bCq1','Brhad Mrdanga'),
  ('b526452b-245e-5d73-a0d0-4b2037b2e8c3'::uuid,'Ayush Goyal','wkWvkcJRJXTSWmYX7CIihRJ8bCq1','Brhad Mrdanga'),
  ('b526452b-245e-5d73-a0d0-4b2037b2e8c3'::uuid,'Aman','wkWvkcJRJXTSWmYX7CIihRJ8bCq1','Brhad Mrdanga'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Rajesh','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Deepak','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Anudeep','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Shouvik','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Raj','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda'),
  ('cc11b518-2863-5a2b-8688-73de0698b60d'::uuid,'Siddh','yY0tKrL7UNfJjY2Fqd4yBvCsyw02','Sri Sri Radha Govinda');

-- Safety: every referenced team must already exist in the migrated database.
do $$
begin
  if exists (
    select 1 from _firebase_team_member_seed s
    left join public.teams t on t.id = s.team_id
    where t.id is null
  ) then
    raise exception 'A historical Firebase team expected by the membership migration is missing';
  end if;
end $$;

-- The audit trigger requires auth.uid(); migration sessions have none.
alter table public.individuals disable trigger audit_individual;

-- Reuse an existing individual only when the historical member name matches exactly
-- after trimming/case/whitespace normalization. Otherwise create a historical individual
-- using the name exactly as it appeared in Firebase; we do not guess identities.
with wanted as (
  select
    t.temple_id,
    lower(regexp_replace(trim(s.member_name), '[[:space:]]+', ' ', 'g')) as normalized_name,
    min(trim(s.member_name)) as display_name
  from _firebase_team_member_seed s
  join public.teams t on t.id = s.team_id
  group by t.temple_id, lower(regexp_replace(trim(s.member_name), '[[:space:]]+', ' ', 'g'))
), missing as (
  select w.*
  from wanted w
  where not exists (
    select 1 from public.individuals i
    where i.temple_id = w.temple_id
      and lower(regexp_replace(trim(i.name), '[[:space:]]+', ' ', 'g')) = w.normalized_name
  )
)
insert into public.individuals(id, temple_id, name)
select gen_random_uuid(), temple_id, display_name from missing;

alter table public.individuals enable trigger audit_individual;

-- Link each reconstructed member to the corresponding historical team.
insert into public.team_members(team_id, individual_id)
select
  s.team_id,
  chosen.id
from _firebase_team_member_seed s
join public.teams t on t.id = s.team_id
join lateral (
  select i.id
  from public.individuals i
  where i.temple_id = t.temple_id
    and lower(regexp_replace(trim(i.name), '[[:space:]]+', ' ', 'g')) =
        lower(regexp_replace(trim(s.member_name), '[[:space:]]+', ' ', 'g'))
  order by i.id
  limit 1
) chosen on true
on conflict (team_id, individual_id) do nothing;

-- Validation: all 168 source-supported memberships must now be present.
do $$
declare expected_count integer; actual_count integer;
begin
  select count(*) into expected_count from _firebase_team_member_seed;
  select count(*) into actual_count
  from _firebase_team_member_seed s
  where exists (
    select 1
    from public.team_members tm
    join public.individuals i on i.id = tm.individual_id
    join public.teams t on t.id = tm.team_id
    where tm.team_id = s.team_id
      and lower(regexp_replace(trim(i.name), '[[:space:]]+', ' ', 'g')) =
          lower(regexp_replace(trim(s.member_name), '[[:space:]]+', ' ', 'g'))
      and i.temple_id = t.temple_id
  );
  if actual_count <> expected_count then
    raise exception 'Historical team membership validation failed: expected %, found %', expected_count, actual_count;
  end if;
end $$;

commit;
