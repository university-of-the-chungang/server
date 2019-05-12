# node-express-generator-template

### 2019-05-12 로그인 API Sample 추가
../test 페이지 접속 후 테스트 가능

DB.js를 require 후 login_admin(아이디, 비밀번호) 를 이용해 결과를 받을 수 있다.
1. 로그인 성공시 
> "1"  

2. 로그인 실패시  
> "0"  

3. 공백을 보낼시
> "Please fill the blank."  

4. 기타 SQL 에러시
> "{$에러내용}"  

* sample Code
```
DB.login_admin(req.body['login_name'], req.body['login_pw']).catch(err => {
    if (String(err) === 'Please fill the blank.') {
      res.json({
        "status": 400,
        code: "4005",
        description: "빈칸을 모두 채우세요",
        message: err
      });
    } else {
      res.json({
        "status": 500,
        code: "5000",
        description: "서버에러",
        message: "Internal Server Error"
      });
    }
  }).then((result) => {
    if (result === 1) {
      res.json({
        status: 200,
        code: 200
        , message: "Success",
        data: null
      });
    } else {
      res.json({
        status: 400,
        code: 4006,
        description: "로그인실패",
        message: "Login Failed"
      });
    }
  }).catch(() => {
  });
```

![TestPage](./test_page.png)

## 사용된 SAMPLE API  

| 메소드 | 경로 | 짧은 설명 |
| ------ | ------ | ------ |
| POST | /user/signin | 로그인 |
### 요청 헤더
```
Content-Type: application/json
```
### 요청 바디
| 변수 이름 | 설명 | 타입 | 값 | 비고 |
| ------ | ------ | ------ | ------ | ------ |
| login_name | 아이디 | VARCHAR | NOTNULL |
| login_pw | 비밀번호 | VARCHAR | NOTNULL |
* example
```
{
    "login_name": "nsrcau",
    "login_pw": "nsrcau11!"
}
```
## Response

### 성공
```
{
    "status": 200,
    "code": 200,
    "message": "success",
    "data": null
}
```
### 실패

* 로그인 실패
```
{
    "status": 400,
    "code": 4006,
    "description": "로그인 실패",
    "message": "Login Failed"
}
```
* 빈값이 넘어온경우
```
{
    "status": 400,
    "code": 4005,
    "description": "빈칸을 모두 채우세요",
    "message": "Please fill the blank."
}
```
* 서버 에러
```
{ 
    "status": 500,
    "code": 5000,
    "description": '서버에러',
    "message": 'Internal Server Error' 
}

```