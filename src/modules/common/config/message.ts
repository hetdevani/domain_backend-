export const messages = {
    NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'record not found.',
        status: 404,
    },
    MODULE_NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'Module not found.',
        status: 404,
    },
    BAD_REQUEST: {
        code: 'E_BAD_REQUEST',
        message: 'The request cannot be fulfilled due to bad syntax',
        status: 422
    },
    BOUNDARY_INTERSECT: {
        code: 'E_BAD_REQUEST',
        message: 'Boundary is intersecting with other Boundary',
        status: 422
    },
    NEST_OUT_OF_ZONE: {
        code: 'E_BAD_REQUEST',
        message: 'You can not draw nest outside the zone',
        status: 422
    },
    OK: {
        code: 'OK',
        message: 'OK.',
        status: 200
    },
    UPDATE_SUCCESSFULLY: {
        code: 'OK',
        message: 'Updated successfully.',
        status: 200
    },
}