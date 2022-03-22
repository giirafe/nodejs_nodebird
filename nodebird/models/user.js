module.exports = (sequelize, DataTypes)=> (
    sequelize.define('user',{
        email:{
            type: DataTypes.STRING(40),
            allowNull : false,
            uniqure:true,
        },
        nick:{
            type: DataTypes.STRING(15),
            allowNull : false
        },
        password:{
            type:DataTypes.STRING(100),
            allowNull: true, //카카오를 통해 로그인할 시 허용을 해줘야 하기 때문에 비밀번호 allowNull을 허용해준다.
        },
        provider:{
            type: DataTypes.STRING(10),
            defaultValue:'local',
        },
        snsId:{
            type:DataTypes.STRING(30),
            allowNull:true
        }
    },{
        timestamps : true, //DB에서 자동으로 수정 및 생성 날짜 기록
        paranoid: true, // 삭제일 기록 (복구용)
    })

    )
