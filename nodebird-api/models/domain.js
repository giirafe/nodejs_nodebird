module.exports = (sequelize, DataTypes) => (
    sequelize.define('domain', {
        // API 사용 Domain Host 제한을 위한 host type
        host: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        // Premium 여부
        type: {
            type: DataTypes.STRING(10),
            allowNull:false,
        },
        clientSecret : {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        frontSecret : {
            type: DataTypes.STRING(40),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        // validate를 통해 들어오는 데이터의 검증을 추가적으로 해준다.
        validate:{
            unknownType(){
                if (this.type !== 'free' && this.type !== 'premium'){
                    throw new Error('type 컬럼은 Free or Premium이어야 합니다')
                }
            }
        }
    })
)