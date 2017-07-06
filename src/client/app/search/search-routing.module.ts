import { SearchComponent } from './search.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MetaGuard } from '@ngx-meta/core';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'search',
        component: SearchComponent,
        canActivate: [MetaGuard],
        data: {
          meta: {
            title: 'Search',
            description: 'Search for angular related projects on github, to showcase the flicker-free http state transfer of an Angular isomorphic application.'
          }
        }
      }
    ])
  ],
  exports: [RouterModule]
})
export class SearchRoutingModule { }
