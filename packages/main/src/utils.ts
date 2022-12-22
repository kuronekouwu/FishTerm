import { base16 } from "./service/base16";

export function hashpasswordValue(data: any, decode: boolean = false){
    const pwdType = data.connection.password.type


    switch (pwdType) {
        case 0:
            if(decode) data.connection.password.value = base16.decode(
                data.connection.password.value,
            ) 
            else data.connection.password.value = base16.encode(
                data.connection.password.value,
            )
            break;
    }

    return data
}