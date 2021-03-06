import { ExportAssignment, ExportDeclaration, Identifier, StringLiteral } from 'typescript';

import { DefaultDeclaration } from '../declarations/DefaultDeclaration';
import { AllExport } from '../exports/AllExport';
import { AssignedExport } from '../exports/AssignedExport';
import { NamedExport } from '../exports/NamedExport';
import { Resource } from '../resources/Resource';
import { SymbolSpecifier } from '../SymbolSpecifier';
import { isExportDeclaration, isNamedExports, isStringLiteral } from '../type-guards/TypescriptGuards';
import { getDefaultResourceIdentifier } from './parse-utilities';

/**
 * Parses an export node into the declaration.
 * 
 * @export
 * @param {Resource} resource
 * @param {(ExportDeclaration | ExportAssignment)} node
 */
export function parseExport(resource: Resource, node: ExportDeclaration | ExportAssignment): void {
    if (isExportDeclaration(node)) {
        const tsExport = node as ExportDeclaration;
        if (!isStringLiteral(tsExport.moduleSpecifier)) {
            return;
        }
        if (tsExport.getText().indexOf('*') > -1) {
            resource.exports.push(
                new AllExport(
                    node.getStart(), node.getEnd(), (tsExport.moduleSpecifier as StringLiteral).text,
                ),
            );
        } else if (tsExport.exportClause && isNamedExports(tsExport.exportClause)) {
            const lib = tsExport.moduleSpecifier as StringLiteral;
            const ex = new NamedExport(node.getStart(), node.getEnd(), lib.text);

            ex.specifiers = tsExport.exportClause.elements.map(
                o => o.propertyName && o.name ?
                    new SymbolSpecifier(o.propertyName.text, o.name.text) :
                    new SymbolSpecifier(o.name.text),
            );

            resource.exports.push(ex);
        }
    } else {
        const literal = node.expression as Identifier;
        if (node.isExportEquals) {
            resource.exports.push(new AssignedExport(node.getStart(), node.getEnd(), literal.text, resource));
        } else {
            const name = (literal && literal.text) ? literal.text : getDefaultResourceIdentifier(resource);
            resource.declarations.push(new DefaultDeclaration(name, resource));
        }
    }
}
